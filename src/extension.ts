import * as vscode from 'vscode';
import { ExternalAIManager } from './ai/ExternalAIManager';
import { ChangeDetector } from './core/ChangeDetector';
import { CodeReviewPanel } from './ui/CodeReviewPanel';
import { InlineAnnotationsProvider } from './ui/InlineAnnotationsProvider';
import { ReviewRequest, ChangeType } from './types';

let externalAIManager: ExternalAIManager;
let changeDetector: ChangeDetector;
let inlineAnnotationsProvider: InlineAnnotationsProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Code Review Assistant is now active!');

    // Initialize components
    changeDetector = new ChangeDetector();
    externalAIManager = ExternalAIManager.getInstance();
    externalAIManager.setChangeDetector(changeDetector);
    inlineAnnotationsProvider = new InlineAnnotationsProvider();

    // Register commands
    const commands = [
        // External AI commands
        vscode.commands.registerCommand('aiCodeReview.copyPrompt', async () => {
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
                vscode.window.showErrorMessage(`Failed to copy prompt: ${error}`);
            }
        }),
        vscode.commands.registerCommand('aiCodeReview.copyQuickPrompt', async () => {
            try {
                const request: ReviewRequest = {
                    changeInfo: {
                        type: ChangeType.LOCAL,
                        source: 'workspace',
                        files: []
                    },
                    aiProvider: 'external'
                };
                await externalAIManager.showQuickPrompt(request);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy quick prompt: ${error}`);
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
}
