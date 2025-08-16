import * as vscode from 'vscode';
import { CodeReviewManager } from './core/CodeReviewManager';
import { IssuesPanelProvider } from './ui/IssuesPanelProvider';
import { InlineAnnotationsProvider } from './ui/InlineAnnotationsProvider';
import { AIProviderManager } from './ai/AIProviderManager';
import { ChangeDetector } from './core/ChangeDetector';
import { StorageManager } from './core/StorageManager';

let codeReviewManager: CodeReviewManager;
let issuesPanelProvider: IssuesPanelProvider;
let inlineAnnotationsProvider: InlineAnnotationsProvider;
let aiProviderManager: AIProviderManager;
let changeDetector: ChangeDetector;
let storageManager: StorageManager;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Code Review Assistant is now active!');

    // Initialize core components
    storageManager = new StorageManager(context.globalState);
    aiProviderManager = new AIProviderManager();
    changeDetector = new ChangeDetector();
    codeReviewManager = new CodeReviewManager(aiProviderManager, changeDetector, storageManager);

    // Initialize UI components
    issuesPanelProvider = new IssuesPanelProvider(codeReviewManager);
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
        vscode.commands.registerCommand('aiCodeReview.reviewAllFiles', () => {
            codeReviewManager.reviewAllFiles();
        }),
        vscode.commands.registerCommand('aiCodeReview.refreshIssues', () => {
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
        })
    ];

    // Register views - using a different approach for compatibility
    // Note: createWebviewView is not available in all VS Code versions
    // We'll use a different approach for now

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
    if (inlineAnnotationsProvider) {
        inlineAnnotationsProvider.dispose();
    }
}
