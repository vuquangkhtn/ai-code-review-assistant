import * as vscode from 'vscode';
import { CodeReviewManager } from './core/CodeReviewManager';
import { IssuesPanelProvider } from './ui/IssuesPanelProvider';
import { ReviewHistoryProvider } from './ui/ReviewHistoryProvider';
import { InlineAnnotationsProvider } from './ui/InlineAnnotationsProvider';
import { AIProviderManager } from './ai/AIProviderManager';
import { ExternalAIManager } from './ai/ExternalAIManager';
import { ChangeDetector } from './core/ChangeDetector';
import { StorageManager } from './core/StorageManager';

let codeReviewManager: CodeReviewManager;
let issuesPanelProvider: IssuesPanelProvider;
let reviewHistoryProvider: ReviewHistoryProvider;
let inlineAnnotationsProvider: InlineAnnotationsProvider;
let aiProviderManager: AIProviderManager;
let externalAIManager: ExternalAIManager;
let changeDetector: ChangeDetector;
let storageManager: StorageManager;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Code Review Assistant is now active!');

    // Initialize core components
    storageManager = new StorageManager(context.globalState);
    aiProviderManager = new AIProviderManager();
    externalAIManager = ExternalAIManager.getInstance(storageManager);
    changeDetector = new ChangeDetector();
    externalAIManager.setChangeDetector(changeDetector);
    codeReviewManager = new CodeReviewManager(aiProviderManager, changeDetector, storageManager);

    // Initialize UI components
    issuesPanelProvider = new IssuesPanelProvider(codeReviewManager);
    reviewHistoryProvider = new ReviewHistoryProvider(codeReviewManager);
    inlineAnnotationsProvider = new InlineAnnotationsProvider(codeReviewManager);

    // Register commands
    const commands = [
        vscode.commands.registerCommand('aiCodeReview.startReview', () => {
            codeReviewManager.startReview();
        }),
        vscode.commands.registerCommand('aiCodeReview.reviewCommitChanges', () => {
            codeReviewManager.reviewCommitChanges();
        }),
        vscode.commands.registerCommand('aiCodeReview.reviewBranchChanges', () => {
            codeReviewManager.reviewBranchChanges();
        }),
        vscode.commands.registerCommand('aiCodeReview.reviewLocalChanges', () => {
            codeReviewManager.reviewLocalChanges();
        }),
        vscode.commands.registerCommand('aiCodeReview.reviewAllFiles', async () => {
            console.log('Extension: reviewAllFiles command triggered');
            try {
                await codeReviewManager.reviewAllFiles();
                console.log('Extension: reviewAllFiles completed successfully');
                
                // Show the AI Code Review view container
                await vscode.commands.executeCommand('workbench.view.extension.aiCodeReview');
                
                // Focus on the issues panel
                await vscode.commands.executeCommand('aiCodeReview.issuesPanel.focus');
                
                // Trigger a refresh of the issues panel
                issuesPanelProvider.refresh();
            } catch (error) {
                console.error('Extension: reviewAllFiles failed:', error);
            }
        }),
        vscode.commands.registerCommand('aiCodeReview.reviewFilesByType', () => {
            codeReviewManager.reviewFilesByType();
        }),
        vscode.commands.registerCommand('aiCodeReview.reviewFilesByDirectory', () => {
            codeReviewManager.reviewFilesByDirectory();
        }),
        vscode.commands.registerCommand('aiCodeReview.reviewAllFilesIncludingSkipped', () => {
            codeReviewManager.reviewAllFilesIncludingSkipped();
        }),
        vscode.commands.registerCommand('aiCodeReview.refreshIssues', () => {
            issuesPanelProvider.refresh();
        }),
        vscode.commands.registerCommand('aiCodeReview.refreshHistory', () => {
            reviewHistoryProvider.refresh();
        }),
        vscode.commands.registerCommand('aiCodeReview.clearHistory', async () => {
            await codeReviewManager.clearReviewResults();
            reviewHistoryProvider.refresh();
            vscode.window.showInformationMessage('Review history cleared.');
        }),
        vscode.commands.registerCommand('aiCodeReview.exportHistory', async () => {
            const results = codeReviewManager.getReviewResults();
            const data = JSON.stringify(results, null, 2);
            
            const uri = await vscode.window.showSaveDialog({
                saveLabel: 'Export Review History',
                defaultUri: vscode.Uri.file('review-history.json'),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                }
            });
            
            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(data, 'utf8'));
                vscode.window.showInformationMessage(`Review history exported to ${uri.fsPath}`);
            }
        }),
        vscode.commands.registerCommand('aiCodeReview.debugStorage', async () => {
            console.log('Extension: Debug storage command triggered');
            const results = codeReviewManager.getReviewResults();
            console.log('Extension: Retrieved', results.length, 'results from storage');
            
            if (results.length > 0) {
                results.forEach((result, index) => {
                    console.log(`Extension: Result ${index}:`, {
                        timestamp: result.metadata.timestamp,
                        timestampType: typeof result.metadata.timestamp,
                        totalIssues: result.summary.totalIssues,
                        issuesCount: result.issues?.length || 0,
                        aiProvider: result.metadata.aiProvider
                    });
                });
            }
            
            vscode.window.showInformationMessage(`Debug: Found ${results.length} stored results. Check console for details.`);
            
            // Force refresh the issues panel
            issuesPanelProvider.refresh();
        }),
        vscode.commands.registerCommand('aiCodeReview.test', () => {
            vscode.window.showInformationMessage('AI Code Review Assistant is working! 🎉');
        }),
        vscode.commands.registerCommand('aiCodeReview.showProviders', async () => {
            await codeReviewManager.showAIProviders();
        }),
        vscode.commands.registerCommand('aiCodeReview.refreshProviders', async () => {
            await aiProviderManager.detectInstalledProviders();
            updateStatusBarItem();
            vscode.window.showInformationMessage('AI providers refreshed!');
        }),
        vscode.commands.registerCommand('aiCodeReview.debugProviders', async () => {
            const debugInfo = await aiProviderManager.getDebugInfo();
            const output = vscode.window.createOutputChannel('AI Code Review Debug');
            output.appendLine('=== AI Provider Debug Information ===');
            output.appendLine(JSON.stringify(debugInfo, null, 2));
            output.show();
        }),
        vscode.commands.registerCommand('aiCodeReview.showView', async () => {
            // Show the AI Code Review view container
            await vscode.commands.executeCommand('workbench.view.extension.aiCodeReview');
            // Focus on the issues panel
            await vscode.commands.executeCommand('aiCodeReview.issuesPanel.focus');
        }),
        vscode.commands.registerCommand('aiCodeReview.selectAIProvider', async () => {
            const allProviders = aiProviderManager.getAllProviders();
            if (allProviders.length === 0) {
                vscode.window.showErrorMessage('No AI providers available. Please install at least one supported extension.');
                return;
            }

            const currentProvider = aiProviderManager.getCachedProvider();
            const options = allProviders.map(provider => ({
                label: provider.name,
                description: provider.isInstalled ? '✅ Installed' : '❌ Not installed',
                detail: provider.id === currentProvider ? '⭐ Currently selected' : (provider.isInstalled ? 'Ready to use' : 'Click to install'),
                value: provider.id
            }));

            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: `Current: ${aiProviderManager.getProviderName(currentProvider || '')} - Select new AI provider`
            });

            if (!selected) return;

            const provider = allProviders.find(p => p.id === selected.value);
            if (provider && !provider.isInstalled) {
                // Show installation guidance for uninstalled providers
                const guidance = aiProviderManager.getInstallationGuidance(provider.id);
                const action = await vscode.window.showInformationMessage(
                    `${provider.name} is not installed.\n\n${guidance}`,
                    'Open Extensions',
                    'Cancel'
                );
                if (action === 'Open Extensions') {
                    vscode.commands.executeCommand('workbench.extensions.search', provider.name);
                }
                return;
            }

            // Update the cached provider
            await aiProviderManager.setCachedProvider(selected.value);
            vscode.window.showInformationMessage(`AI provider changed to: ${provider?.name}`);
        }),
        
        // External AI commands
        vscode.commands.registerCommand('aiCodeReview.copyPrompt', async () => {
            try {
                const request = await codeReviewManager.createReviewRequest();
                if (request) {
                    await externalAIManager.copyPromptToClipboard(request);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy prompt: ${error}`);
            }
        }),
        vscode.commands.registerCommand('aiCodeReview.copyQuickPrompt', async () => {
            try {
                const request = await codeReviewManager.createReviewRequest();
                if (request) {
                    await externalAIManager.showQuickPrompt(request);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy quick prompt: ${error}`);
            }
        }),
        vscode.commands.registerCommand('aiCodeReview.pasteResponse', async () => {
            try {
                const request = await codeReviewManager.createReviewRequestWithLastChangeType();
                if (request) {
                    const result = await externalAIManager.pasteAndProcessResponse(request);
                    if (result) {
                        issuesPanelProvider.refresh();
                        reviewHistoryProvider.refresh();
                    }
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to process response: ${error}`);
            }
        }),
        vscode.commands.registerCommand('aiCodeReview.pasteResponseWebview', async () => {
            try {
                const request = await codeReviewManager.createReviewRequestWithLastChangeType();
                if (request) {
                    const result = await externalAIManager.showResponseInputWebview(request);
                    if (result) {
                        issuesPanelProvider.refresh();
                        reviewHistoryProvider.refresh();
                    }
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to process response: ${error}`);
            }
        }),
        vscode.commands.registerCommand('aiCodeReview.showFormatExamples', async () => {
             await externalAIManager.showFormatExamples();
         }),
        vscode.commands.registerCommand('aiCodeReview.checkReviewResult', async () => {
            try {
                const result = await externalAIManager.checkReviewResultFromFile();
                if (result) {
                    issuesPanelProvider.refresh();
                    reviewHistoryProvider.refresh();
                    vscode.window.showInformationMessage('Code review result processed successfully!');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to process review result: ${error}`);
            }
        })
     ];

    // Register webview view providers
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            IssuesPanelProvider.viewType,
            issuesPanelProvider
        ),
        vscode.window.registerWebviewViewProvider(
            ReviewHistoryProvider.viewType,
            reviewHistoryProvider
        )
    );

    // Register inline annotations
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { scheme: 'file', language: 'typescript' },
            inlineAnnotationsProvider
        ),
        vscode.languages.registerCodeLensProvider(
            { scheme: 'file', language: 'javascript' },
            inlineAnnotationsProvider
        ),
        vscode.languages.registerCodeLensProvider(
            { scheme: 'file', language: 'html' },
            inlineAnnotationsProvider
        )
    );

    // Add commands to context
    context.subscriptions.push(...commands);

    // Function to update status bar item
    function updateStatusBarItem() {
        const availableProviders = aiProviderManager.getAvailableProviders();
        const totalProviders = aiProviderManager.getAllProviders().length;
        
        if (availableProviders.length === 0) {
            statusBarItem.text = '$(error) No AI Providers';
            statusBarItem.backgroundColor = new vscode.ThemeColor('errorBar.background');
        } else if (availableProviders.length === totalProviders) {
            statusBarItem.text = `$(check) ${availableProviders.length} AI Providers`;
            statusBarItem.backgroundColor = undefined;
        } else {
            statusBarItem.text = `$(warning) ${availableProviders.length}/${totalProviders} AI Providers`;
            statusBarItem.backgroundColor = new vscode.ThemeColor('warningBar.background');
        }
    }

    // Initialize with current workspace
    if (vscode.workspace.workspaceFolders) {
        codeReviewManager.initializeWorkspace(vscode.workspace.workspaceFolders[0]);
    }

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'aiCodeReview.showProviders';
    statusBarItem.tooltip = 'Click to view AI providers status';
    updateStatusBarItem();
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

export function deactivate() {
    if (codeReviewManager) {
        codeReviewManager.dispose();
    }
    if (issuesPanelProvider) {
        issuesPanelProvider.dispose();
    }
    if (reviewHistoryProvider) {
        reviewHistoryProvider.dispose();
    }
    if (inlineAnnotationsProvider) {
        inlineAnnotationsProvider.dispose();
    }
}
