import * as vscode from 'vscode';
import { CodeIssue } from '../types';

export class CodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    
    private issues: CodeIssue[] = [];
    private resolvedIssues: Set<string> = new Set();

    constructor() {
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('aiCodeReview.codeLens')) {
                this._onDidChangeCodeLenses.fire();
            }
        });
    }

    /**
     * Update the issues that will be used to generate CodeLens
     */
    public updateIssues(issues: CodeIssue[], resolvedIssues: Set<string> = new Set()): void {
        this.issues = issues;
        this.resolvedIssues = resolvedIssues;
        this._onDidChangeCodeLenses.fire();
    }

    /**
     * Mark an issue as resolved
     */
    public markIssueResolved(issueId: string): void {
        this.resolvedIssues.add(issueId);
        this._onDidChangeCodeLenses.fire();
    }

    /**
     * Mark an issue as unresolved
     */
    public markIssueUnresolved(issueId: string): void {
        this.resolvedIssues.delete(issueId);
        this._onDidChangeCodeLenses.fire();
    }

    /**
     * Provide CodeLens for the given document
     */
    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | vscode.ProviderResult<vscode.CodeLens[]> {
        const config = vscode.workspace.getConfiguration('aiCodeReview');
        
        // Check if CodeLens is enabled
        if (!config.get('codeLens.enabled', true)) {
            return [];
        }

        // Check if this file type is supported
        const supportedLanguages = config.get('supportedLanguages', ['javascript', 'typescript', 'html']);
        if (!supportedLanguages.includes(document.languageId)) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const documentPath = document.uri.fsPath;

        // Filter issues for this document
        const documentIssues = this.issues.filter(issue => {
            // Normalize paths for comparison
            const issuePath = issue.filePath?.replace(/\\/g, '/');
            const docPath = documentPath.replace(/\\/g, '/');
            return issuePath && docPath.endsWith(issuePath);
        });

        // Create CodeLens for each issue
        for (const issue of documentIssues) {
            try {
                // Convert from 1-based line number to 0-based for VS Code
                const lineNumber = Math.max(0, issue.lineNumber - 1);
                
                // Ensure line number is within document bounds
                if (lineNumber >= document.lineCount) {
                    continue;
                }

                const line = document.lineAt(lineNumber);
                const range = new vscode.Range(lineNumber, 0, lineNumber, line.text.length);
                
                const isResolved = this.resolvedIssues.has(issue.id);
                const actionText = isResolved ? '✅ Mark as Unresolved' : '🔧 Mark as Resolved';
                const command = isResolved ? 'aiCodeReview.markIssueUnresolved' : 'aiCodeReview.markIssueResolved';
                
                const codeLens = new vscode.CodeLens(range, {
                    title: actionText,
                    command: command,
                    arguments: [undefined, issue.id]
                });

                codeLenses.push(codeLens);
            } catch (error) {
                console.error('Error creating CodeLens for issue:', issue.id, error);
            }
        }

        return codeLenses;
    }

    /**
     * Resolve a CodeLens (optional implementation)
     */
    public resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.CodeLens | vscode.ProviderResult<vscode.CodeLens> {
        return codeLens;
    }

    /**
     * Refresh CodeLens display
     */
    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this._onDidChangeCodeLenses.dispose();
    }
}