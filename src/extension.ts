import { groupComparison } from './ai/Comparison';
import { ComparisonTreeProvider } from './ui/ComparisonTreeProvider';
import { ResponseParser } from './ai/ResponseParser';
import * as fs from 'fs/promises';
import { detectCLIPresets, selectCLICommand, selectComparisonProviders, suggestFailureRecovery, switchCLIProvider, FailureRecovery } from './ai/CLIPresets';
import { runCLIReview } from './ai/CLIReview';
import { PromptGenerator } from './ai/PromptGenerator';
import * as vscode from 'vscode';
import { ExternalAIManager } from './ai/ExternalAIManager';
import { ChangeDetector } from './core/ChangeDetector';
import { CodeReviewPanel } from './ui/CodeReviewPanel';
import { WorkflowGuidePanel } from './ui/WorkflowGuidePanel';
import { InlineAnnotationsProvider } from './ui/InlineAnnotationsProvider';
import { CodeReviewTreeProvider } from './ui/CodeReviewTreeProvider';
import { IssuesPanelProvider } from './ui/IssuesPanelProvider';
import { CodeLensProvider } from './ui/CodeLensProvider';
import { CleanupManager } from './utils/CleanupManager';
import { ReviewRequest, ChangeType, CodeIssue } from './types';


let externalAIManager: ExternalAIManager;
let changeDetector: ChangeDetector;
let inlineAnnotationsProvider: InlineAnnotationsProvider;
let codeReviewTreeProvider: CodeReviewTreeProvider;
let issuesPanelProvider: IssuesPanelProvider;
let codeLensProvider: CodeLensProvider;
let resultFileWatcher: vscode.FileSystemWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Code Review Assistant is now active!');
    // Test comment to verify git diff detection

    // Initialize components
    changeDetector = new ChangeDetector();
    
    // Initialize ChangeDetector with workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        changeDetector.initialize(workspaceFolder).catch(error => {
            console.error('Failed to initialize ChangeDetector:', error);
        });
    }
    
    externalAIManager = ExternalAIManager.getInstance();
    externalAIManager.setChangeDetector(changeDetector);
    inlineAnnotationsProvider = new InlineAnnotationsProvider();
    codeReviewTreeProvider = new CodeReviewTreeProvider();
    issuesPanelProvider = new IssuesPanelProvider();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('aiCodeReview.policy.blockOn')) {
            issuesPanelProvider.refresh();
            CodeReviewPanel.currentPanel?.refreshPolicy();
        }
    }));
    codeLensProvider = new CodeLensProvider();

    // Register tree data providers for sidebar
    vscode.window.registerTreeDataProvider('aiCodeReviewPanel', codeReviewTreeProvider);
    vscode.window.registerTreeDataProvider('aiCodeReviewIssues', issuesPanelProvider);

    const comparisonTree = new ComparisonTreeProvider();
    context.subscriptions.push(comparisonTree, vscode.window.registerTreeDataProvider('aiCodeReviewComparison', comparisonTree));

    // Register CodeLens provider for supported languages
    const config = vscode.workspace.getConfiguration('aiCodeReview');
    const supportedLanguages = config.get('codeLens.selector', ['javascript', 'typescript', 'html', 'css', 'json', 'jsx', 'tsx']);
    
    const codeLensDisposable = vscode.languages.registerCodeLensProvider(
        supportedLanguages.map(lang => ({ language: lang })),
        codeLensProvider
    );
    context.subscriptions.push(codeLensDisposable);

    // Setup file watcher for .ai-code-review/results directory
    setupResultFileWatcher(context);

    const cliOutput = vscode.window.createOutputChannel('AI Code Review CLI');
    let cliRun: AbortController | undefined;
    context.subscriptions.push(cliOutput, { dispose: () => cliRun?.abort() });

    const refuseDuringCLIReview = (): boolean => {
        if (!cliRun) { return false; }
        vscode.window.showWarningMessage('A CLI review is running — cancel it first.');
        return true;
    };

    const selectComparisonBranches = async (allowCheckout: () => boolean) => {
        // Get all branches
        const branches = await changeDetector.getBranches();
        if (branches.length < 2) {
            vscode.window.showErrorMessage('At least 2 branches are required for comparison.');
            return;
        }

        // Get default source branch
        const defaultSourceBranch = await changeDetector.getDefaultSourceBranch();
        const currentBranch = await changeDetector.getCurrentBranch();

        // Create branch options for quick pick
        const branchOptions = branches.map(branch => ({
            label: branch,
            description: branch === currentBranch ? '(current)' : ''
        }));

        // Select source branch
        const selectedSource = await vscode.window.showQuickPick(branchOptions, {
            placeHolder: `Select source branch ${defaultSourceBranch ? `(default: ${defaultSourceBranch})` : ''}`,
            title: 'Compare Branches - Step 1/2: Select Source Branch'
        });

        if (!selectedSource) {
            return;
        }

        const sourceBranch = selectedSource.label;

        // Select target branch (exclude the selected source branch)
        const targetBranchOptions = branches
            .filter(branch => branch !== sourceBranch)
            .map(branch => ({
                label: branch,
                description: branch === currentBranch ? '(current)' : ''
            }));

        const selectedTarget = await vscode.window.showQuickPick(targetBranchOptions, {
            placeHolder: 'Select target branch to compare against',
            title: 'Compare Branches - Step 2/2: Select Target Branch'
        });

        if (!selectedTarget) {
            return;
        }

        const targetBranch = selectedTarget.label;

        if (!allowCheckout()) { return; }

        // Attempt to checkout to the target branch automatically
        try {
            await changeDetector.checkoutBranch(targetBranch);
        } catch (checkoutError) {
            vscode.window.showErrorMessage(
                `Failed to checkout to target branch '${targetBranch}'. If you have local changes, please reset or stash them and try again.\nDetails: ${checkoutError}`
            );
            return;
        }

        return { source: sourceBranch, target: targetBranch };
    };

    const collectCLIChanges = async (controller: AbortController) => {
        const changeType = vscode.workspace.getConfiguration('aiCodeReview').get<string>('defaultChangeType', 'local');
        if (changeType !== 'branch' && changeType !== 'commit') {
            controller.signal.throwIfAborted();
            return changeDetector.detectAndStoreLocalChanges();
        }
        const branches = await selectComparisonBranches(() => !controller.signal.aborted);
        controller.signal.throwIfAborted();
        if (!branches) { return; }
        return changeDetector.detectAndStoreBranchChanges(branches.source, branches.target);
    };

    // Register commands
    const commands = [
        // External AI commands
        vscode.commands.registerCommand('aiCodeReview.copyPrompt', async () => {
            if (refuseDuringCLIReview()) { return; }
            // Get the default change type from configuration
            const config = vscode.workspace.getConfiguration('aiCodeReview');
            const defaultChangeType = config.get<string>('defaultChangeType', 'local');
            
            // Map change types to commands
            const commandMap: Record<string, string> = {
                'local': 'aiCodeReview.copyPromptLocalChanges',
                'commit': 'aiCodeReview.copyPromptCompareBranches', // Use branch comparison for commit-like workflow
                'branch': 'aiCodeReview.copyPromptCompareBranches'
            };
            
            const command = commandMap[defaultChangeType];
            if (command) {
                await vscode.commands.executeCommand(command);
            } else {
                // Fallback to showing options if invalid configuration
                const options = [
                    {
                        label: '$(git-branch) Local Changes',
                        description: 'Only local changes',
                        command: 'aiCodeReview.copyPromptLocalChanges'
                    },
                    {
                        label: '$(git-compare) Compare Branches',
                        description: 'Compare changes between two branches',
                        command: 'aiCodeReview.copyPromptCompareBranches'
                    }
                ];

                const selected = await vscode.window.showQuickPick(options, {
                    placeHolder: 'Select the type of code review prompt to copy'
                });

                if (selected) {
                    await vscode.commands.executeCommand(selected.command);
                }
            }
        }),

        // Confirm-to-stop: the palette command and the CLI Review row click both land here.
        // Extension shutdown keeps its own direct abort path (no dialog).
        vscode.commands.registerCommand('aiCodeReview.cancelCLIReview', async () => {
            const run = cliRun;
            if (!run) {
                // Self-heal: a stale `running` row with no active run is a dead button.
                // Reset it so the row offers re-run again instead of silently no-oping.
                if (codeReviewTreeProvider.getCLIStatus().kind === 'running') {
                    codeReviewTreeProvider.setCLIStatus({ kind: 'idle' });
                }
                return;
            }
            const choice = await vscode.window.showWarningMessage('Stop the running review?', { modal: true }, 'Stop');
            if (choice === 'Stop') { run.abort(); }
        }),
        vscode.commands.registerCommand('aiCodeReview.showCLIOutput', () => cliOutput.show(true)),
        ...['aiCodeReview.runCLIReview', 'aiCodeReview.compareCLIReviews'].map(commandId =>
        vscode.commands.registerCommand(commandId, async () => {
            if (refuseDuringCLIReview()) { return; }
            const controller = new AbortController();
            cliRun = controller;
            cliOutput.clear();
            cliOutput.show(true);
            codeReviewTreeProvider.setCLIStatus({ kind: 'running' });
            let attemptedProvider: string | undefined;
            let cliAttempted = false;
            try {
                const workspace = vscode.workspace.workspaceFolders?.[0];
                if (!workspace || !vscode.workspace.isTrusted) {
                    throw new Error('CLI review requires a trusted workspace.');
                }
                const stallTimeoutMs = vscode.workspace.getConfiguration('aiCodeReview', workspace.uri)
                    .get<number>('cli.stallTimeoutMs', 120000);
                if (commandId === 'aiCodeReview.compareCLIReviews') {
                    const configured = vscode.workspace.getConfiguration('aiCodeReview', workspace.uri)
                        .get<Record<string, string>>('cli.comparisonCommands', {});
                    const selection = await selectComparisonProviders({
                        configured,
                        choose: items => vscode.window.showQuickPick(items, {
                            canPickMany: true, placeHolder: 'Select exactly two providers to compare (code is sent to both CLIs)'
                        })
                    });
                    if (selection.kind === 'cancelled') { codeReviewTreeProvider.setCLIStatus({ kind: 'idle' }); return; }
                    if (selection.kind === 'error') { throw new Error(selection.message); }
                    const changes = await collectCLIChanges(controller);
                    if (!changes) { codeReviewTreeProvider.setCLIStatus({ kind: 'idle' }); return; }
                    const prompt = PromptGenerator.generateFileReferencePrompt(changes.filePath, 'cli').content;
                    const reviews = [];
                    for (const provider of selection.providers) {
                        controller.signal.throwIfAborted();
                        cliOutput.appendLine(`\nProvider: ${provider.label}`);
                        cliAttempted = true;
                        const file = await runCLIReview({ command: provider.command, cwd: workspace.uri.fsPath, prompt,
                            signal: controller.signal,
                            review: { type: changes.changeInfo.type, files: changes.changeInfo.files.map(file => file.path) },
                            onProgress: progress => codeReviewTreeProvider.setCLIStatus({ kind: 'running', progress }),
                            onStdout: chunk => cliOutput.append(chunk),
                            stallTimeoutMs });
                        const result = ResponseParser.parseResponse(await fs.readFile(file, 'utf8'), provider.label, []);
                        if (!result) { throw new Error(`Cannot parse results from ${provider.label}`); }
                        reviews.push({ provider: provider.label, issues: result.issues });
                    }
                    comparisonTree.update(groupComparison(reviews));
                    await vscode.commands.executeCommand('aiCodeReviewComparison.focus');
                    codeReviewTreeProvider.setCLIStatus({ kind: 'done' });
                    return;
                }
                const customCommand = vscode.workspace.getConfiguration('aiCodeReview', workspace.uri)
                    .get<string>('cli.customCommand', '').trim();
                const savedProvider = context.globalState.get<string>('aiCodeReview.cli.defaultProvider');
                const defaultProvider = vscode.workspace.getConfiguration('aiCodeReview', workspace.uri)
                    .get<string>('cli.defaultProvider', 'auto');
                attemptedProvider = customCommand ? 'custom'
                    : (defaultProvider !== 'auto' ? defaultProvider : savedProvider);
                const command = await selectCLICommand({
                    customCommand,
                    savedProvider,
                    defaultProvider,
                    choose: providers => vscode.window.showQuickPick(providers, { placeHolder: 'Choose a CLI for AI reviews' }),
                    save: provider => context.globalState.update('aiCodeReview.cli.defaultProvider', provider)
                });
                if (!command) { codeReviewTreeProvider.setCLIStatus({ kind: 'idle' }); return; }
                const changes = await collectCLIChanges(controller);
                if (!changes) { codeReviewTreeProvider.setCLIStatus({ kind: 'idle' }); return; }
                const prompt = PromptGenerator.generateFileReferencePrompt(changes.filePath, 'cli').content;
                cliAttempted = true;
                await runCLIReview({ command, cwd: workspace.uri.fsPath, prompt,
                    signal: controller.signal,
                    review: { type: changes.changeInfo.type, files: changes.changeInfo.files.map(file => file.path) },
                    onProgress: progress => codeReviewTreeProvider.setCLIStatus({ kind: 'running', progress }),
                    onStdout: chunk => cliOutput.append(chunk),
                    stallTimeoutMs });
                codeReviewTreeProvider.setCLIStatus({ kind: 'done' });
            } catch (error) {
                if (!controller.signal.aborted) {
                    const message = error instanceof Error ? error.message : String(error);
                    let recovery: FailureRecovery | undefined;
                    // Recovery guidance also applies to provider-selection failures: when the
                    // configured provider is missing from PATH no CLI process has run yet
                    // (cliAttempted is false), but the attempted provider is known and the
                    // dialog must still offer switching or settings instead of a raw error.
                    if (cliAttempted || attemptedProvider) {
                        try {
                            recovery = suggestFailureRecovery({
                                failedProvider: attemptedProvider,
                                detected: (await detectCLIPresets()).map(provider => provider.id)
                            });
                        } catch { /* guidance must never mask the original failure */ }
                    }
                    const failed = recovery ? `${message}\n${recovery.message}` : message;
                    cliOutput.appendLine(`\nCLI review failed: ${failed}`);
                    codeReviewTreeProvider.setCLIStatus({ kind: 'failed', message: failed });
                    const actions = recovery
                        ? (recovery.alternatives.length ? ['Switch CLI Provider', 'Show Output'] : ['Show Output', 'Open Settings'])
                        : [];
                    const picked = await vscode.window.showErrorMessage(`CLI review failed: ${message}`, ...actions);
                    if (picked === 'Switch CLI Provider') {
                        await vscode.commands.executeCommand('aiCodeReview.selectCLIProvider');
                    } else if (picked === 'Show Output') {
                        await vscode.commands.executeCommand('aiCodeReview.showCLIOutput');
                    } else if (picked === 'Open Settings') {
                        await vscode.commands.executeCommand('workbench.action.openSettings', 'aiCodeReview.cli');
                    }
                    throw error;
                }
            } finally {
                // Terminal-status guard (issue #38): the run command sets failed/done/idle on
                // its known exits; if any path ever leaves the row `running`, force the
                // neutral terminal state here so the row can never stay stuck.
                if (controller.signal.aborted || codeReviewTreeProvider.getCLIStatus().kind === 'running') {
                    codeReviewTreeProvider.setCLIStatus({ kind: 'idle' });
                }
                cliRun = undefined;
            }
        })),

        vscode.commands.registerCommand('aiCodeReview.selectCLIProvider', async () => {
            const workspace = vscode.workspace.workspaceFolders?.[0];
            if (!workspace || !vscode.workspace.isTrusted) {
                vscode.window.showErrorMessage('Selecting a CLI provider requires a trusted workspace.');
                return;
            }
            const config = vscode.workspace.getConfiguration('aiCodeReview', workspace.uri);
            try {
                const result = await switchCLIProvider({
                    customCommand: config.get<string>('cli.customCommand', ''),
                    defaultProviderSetting: config.get<string>('cli.defaultProvider', 'auto'),
                    persistedProvider: context.globalState.get<string>('aiCodeReview.cli.defaultProvider'),
                    choose: items => vscode.window.showQuickPick(items, {
                        placeHolder: 'Select the CLI provider for AI reviews'
                    }).then(item => item?.id),
                    save: provider => context.globalState.update('aiCodeReview.cli.defaultProvider', provider),
                    saveSetting: provider => vscode.workspace.getConfiguration('aiCodeReview')
                        .update('cli.defaultProvider', provider, vscode.ConfigurationTarget.Global)
                });
                if (result.kind === 'switched') {
                    vscode.window.showInformationMessage(result.provider === 'custom'
                        ? 'CLI reviews will use the custom command (aiCodeReview.cli.customCommand).'
                        : `CLI provider set to ${result.provider}.`);
                } else if (result.kind === 'error') {
                    vscode.window.showErrorMessage(result.message);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to switch CLI provider: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.copyPromptLocalChanges', async () => {
            if (refuseDuringCLIReview()) { return; }
            try {
                const request: ReviewRequest = {
                    changeInfo: {
                        type: ChangeType.LOCAL,
                        source: 'workspace',
                        files: []
                    },
                    aiProvider: 'external'
                };
                await externalAIManager.copyPromptToClipboard(request);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy prompt for local changes: ${error}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.copyPromptAllFiles', async () => {
            if (refuseDuringCLIReview()) { return; }
            try {
                const request: ReviewRequest = {
                    changeInfo: {
                        type: ChangeType.ALL_FILES,
                        source: 'workspace',
                        files: []
                    },
                    aiProvider: 'external'
                };
                await externalAIManager.copyPromptToClipboard(request);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy prompt for all files: ${error}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.copyPromptCompareBranches', async () => {
            if (refuseDuringCLIReview()) { return; }
            try {
                const branches = await selectComparisonBranches(() => !refuseDuringCLIReview());
                if (!branches) { return; }
                // Create request for branch comparison
                const request: ReviewRequest = {
                    changeInfo: {
                        type: ChangeType.BRANCH,
                        source: branches.source,
                        target: branches.target,
                        files: []
                    },
                    aiProvider: 'external'
                };

                if (refuseDuringCLIReview()) { return; }
                await externalAIManager.copyPromptToClipboard(request);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy prompt for branch comparison: ${error}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.checkReviewResult', async () => {
            try {
                const result = await externalAIManager.checkReviewResultFromFile();
                if (result) {
                    // Update UI components with the review result
                    const panel = CodeReviewPanel.createOrShow(context.extensionUri);
                    panel.updateIssues(result.issues);
                    panel.addReviewToHistory(result);
                    
                    // Update inline annotations
                    inlineAnnotationsProvider.updateIssues(result.issues);
                    
                    // Update issues panel
                    issuesPanelProvider.updateIssues(result.issues);
                    
                    // Update CodeLens provider
                    codeLensProvider.updateIssues(result.issues);
                    
                    vscode.window.showInformationMessage('Code review result processed successfully!');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to process review result: ${error}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.openPromptFile', async () => {
            try {
                const promptFilePath = await externalAIManager.getLastPromptFilePath();
                if (promptFilePath) {
                    await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(promptFilePath));
                } else {
                    vscode.window.showInformationMessage('No prompt file found. Generate a prompt first.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open prompt file: ${error}`);
            }
        }),
        vscode.commands.registerCommand('aiCodeReview.openChangeFile', async () => {
            try {
                const changeFilePath = await externalAIManager.getLastChangeFilePath();
                if (changeFilePath) {
                    await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(changeFilePath));
                } else {
                    vscode.window.showInformationMessage('No change file found. Generate a prompt first.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open change file: ${error}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.openSettings', async () => {
            try {
                // Open VS Code settings filtered to AI Code Review extension
                await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:vuquangkhtn.ai-code-review-assistant');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open settings: ${error}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.setDefaultChangeType', async (changeType: string) => {
            try {
                const config = vscode.workspace.getConfiguration('aiCodeReview');
                await config.update('defaultChangeType', changeType, vscode.ConfigurationTarget.Global);
                
                // Update the tree provider to reflect the change
                codeReviewTreeProvider.updateDefaultChangeType(changeType);
                
                // vscode.window.showInformationMessage(`Default change type set to: ${changeType}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to set default change type: ${error}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.openWorkflowGuide', () => {
            WorkflowGuidePanel.createOrShow(context.extensionUri);
        }),

        vscode.commands.registerCommand('aiCodeReview.pastePrompt', async () => {
            try {
                // Show information message with instructions
                const message = 'You need to paste the prompt into your AI chat manually';
                const action = await vscode.window.showWarningMessage(
                    message,
                    { modal: false },
                    'Open AI Chat Instructions'
                );
                
                if (action === 'Open AI Chat Instructions') {
                    // Show a more detailed guide
                    const detailedMessage = `How to use the AI Code Review prompt:

1. The prompt has been copied to your clipboard
2. Open your preferred AI chat
3. Paste the prompt (Ctrl+V) into the chat
4. Send the message to get your code review
5. When the AI responds, use "Generate Code Review Result" to process it
(Use "Open Workflow Guide" for detail instructions)`;
                    
                    vscode.window.showInformationMessage(detailedMessage, { modal: true });
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to show paste instructions: ${error}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.openIssuesFilter', async () => {
            try {
                issuesPanelProvider.openFilterDialog();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open filter dialog: ${error}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.markIssueResolved', async (treeItem?: any, issueId?: string) => {
            try {
                // Handle both tree view context and direct command calls
                const id = treeItem?.issueId || issueId;
                if (!id) {
                    vscode.window.showErrorMessage('No issue ID provided');
                    return;
                }
                inlineAnnotationsProvider.markIssueAsResolved(id);
                issuesPanelProvider.markIssueResolved(id);
                codeLensProvider.markIssueResolved(id);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to mark issue as resolved: ${error}`);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.markIssueUnresolved', async (treeItem?: any, issueId?: string) => {
            try {
                // Handle both tree view context and direct command calls
                const id = treeItem?.issueId || issueId;
                if (!id) {
                    vscode.window.showErrorMessage('No issue ID provided');
                    return;
                }
                inlineAnnotationsProvider.markIssueAsUnresolved(id);
                issuesPanelProvider.markIssueUnresolved(id);
                codeLensProvider.markIssueUnresolved(id);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to mark issue as unresolved: ${error}`);
            }
        })
     ];

    // Add commands to context
    context.subscriptions.push(...commands);
}

/**
 * Sets up a file system watcher for the .ai-code-review/results directory
 * Automatically triggers checkReviewResult command when new files are detected
 */
function setupResultFileWatcher(context: vscode.ExtensionContext): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return;
    }

    // Create file watcher pattern for .ai-code-review/results directory
    const resultsPattern = new vscode.RelativePattern(
        workspaceFolder,
        '.ai-code-review/results/**/*.json'
    );

    // Create the file watcher
    resultFileWatcher = vscode.workspace.createFileSystemWatcher(resultsPattern);

    // Listen for file creation events
    resultFileWatcher.onDidCreate(async (uri) => {
        try {
            console.log(`New result file detected: ${uri.fsPath}`);
            
            // Add a small delay to ensure file is fully written
            setTimeout(async () => {
                try {
                    // Automatically trigger the checkReviewResult command
                    await vscode.commands.executeCommand('aiCodeReview.checkReviewResult');
                    
                    vscode.window.showInformationMessage(
                        'New AI review result detected and processed automatically!',
                        'View Results'
                    ).then(selection => {
                        if (selection === 'View Results') {
                            // Show the AI Code Review panel
                            vscode.commands.executeCommand('workbench.view.extension.aiCodeReview');
                        }
                    });
                } catch (error) {
                    console.error('Error processing new result file:', error);
                    vscode.window.showErrorMessage(`Failed to process new result file: ${error}`);
                }
            }, 500); // 500ms delay to ensure file is fully written
        } catch (error) {
            console.error('Error in result file watcher:', error);
        }
    });

    // Add the watcher to context subscriptions for proper cleanup
    context.subscriptions.push(resultFileWatcher);

    console.log('Result file watcher setup complete for:', resultsPattern.pattern);
}

export function deactivate() {
    // Cleanup resources
    if (inlineAnnotationsProvider) {
        inlineAnnotationsProvider.dispose();
    }
    if (CodeReviewPanel.currentPanel) {
        CodeReviewPanel.currentPanel.dispose();
    }
    if (resultFileWatcher) {
        resultFileWatcher.dispose();
        resultFileWatcher = undefined;
    }
    
    // Clean up .ai-code-review directory on extension deactivation
    // CleanupManager.cleanupCompleteDirectory().catch(error => {
    //     console.error('Error during extension deactivation cleanup:', error);
    // });
}
