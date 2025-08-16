import * as vscode from 'vscode';
import { ExternalAIManager } from './ai/ExternalAIManager';
import { ChangeDetector } from './core/ChangeDetector';
import { CodeReviewPanel } from './ui/CodeReviewPanel';
import { InlineAnnotationsProvider } from './ui/InlineAnnotationsProvider';
import { CodeReviewTreeProvider } from './ui/CodeReviewTreeProvider';
import { IssuesPanelProvider } from './ui/IssuesPanelProvider';
import { CleanupManager } from './utils/CleanupManager';
import { ReviewRequest, ChangeType, CodeIssue } from './types';


let externalAIManager: ExternalAIManager;
let changeDetector: ChangeDetector;
let inlineAnnotationsProvider: InlineAnnotationsProvider;
let codeReviewTreeProvider: CodeReviewTreeProvider;
let issuesPanelProvider: IssuesPanelProvider;

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

    // Register tree data providers for sidebar
    vscode.window.registerTreeDataProvider('aiCodeReviewPanel', codeReviewTreeProvider);
    vscode.window.registerTreeDataProvider('aiCodeReviewIssues', issuesPanelProvider);

    // Register commands
    const commands = [
        // External AI commands
        vscode.commands.registerCommand('aiCodeReview.copyPrompt', async () => {
            const options = [
                {
                    label: '$(git-branch) Local Changes',
                    description: 'Only local changes (use git diff to check)',
                    command: 'aiCodeReview.copyPromptLocalChanges'
                },
                {
                    label: '$(folder) All Files',
                    description: 'Scan all Files in repo (existing logic)',
                    command: 'aiCodeReview.copyPromptAllFiles'
                }
            ];

            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: 'Select the type of code review prompt to copy'
            });

            if (selected) {
                await vscode.commands.executeCommand(selected.command);
            }
        }),

        vscode.commands.registerCommand('aiCodeReview.copyPromptLocalChanges', async () => {
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
        vscode.commands.registerCommand('aiCodeReview.showFormatExamples', async () => {
             await externalAIManager.showFormatExamples();
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
                    
                    vscode.window.showInformationMessage('Code review result processed successfully!');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to process review result: ${error}`);
            }
        }),
        vscode.commands.registerCommand('aiCodeReview.openPanel', () => {
            CodeReviewPanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('aiCodeReview.closePanel', () => {
            if (CodeReviewPanel.currentPanel) {
                CodeReviewPanel.currentPanel.dispose();
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
        vscode.commands.registerCommand('aiCodeReview.openIssue', async (issue: CodeIssue) => {
            try {
                // Ensure file path is absolute
                let absolutePath = issue.filePath;
                if (!absolutePath.startsWith('/') && !absolutePath.match(/^[a-zA-Z]:/)) {
                    // Relative path - join with workspace root
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                    if (workspaceFolder) {
                        absolutePath = vscode.Uri.joinPath(workspaceFolder.uri, issue.filePath).fsPath;
                    }
                }
                
                const uri = vscode.Uri.file(absolutePath);
                const document = await vscode.workspace.openTextDocument(uri);
                const editor = await vscode.window.showTextDocument(document);
                
                // Navigate to the specific line
                const position = new vscode.Position(Math.max(0, issue.lineNumber - 1), issue.columnNumber || 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open issue: ${error}`);
            }
        })
     ];

    // Add commands to context
    context.subscriptions.push(...commands);
}

export function deactivate() {
    // Cleanup resources
    if (inlineAnnotationsProvider) {
        inlineAnnotationsProvider.dispose();
    }
    if (CodeReviewPanel.currentPanel) {
        CodeReviewPanel.currentPanel.dispose();
    }
    
    // Clean up .ai-code-review directory on extension deactivation
    // CleanupManager.cleanupCompleteDirectory().catch(error => {
    //     console.error('Error during extension deactivation cleanup:', error);
    // });
}
