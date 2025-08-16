import * as vscode from 'vscode';
import { CodeReviewManager } from '../core/CodeReviewManager';
import { ReviewResult, CodeIssue, IssueSeverity, IssueCategory } from '../types';

export class IssuesPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiCodeReview.issuesPanel';
    private _view?: vscode.WebviewView;
    private codeReviewManager: CodeReviewManager;

    constructor(codeReviewManager: CodeReviewManager) {
        this.codeReviewManager = codeReviewManager;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: []
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'navigateToIssue':
                        this.navigateToIssue(message.issue);
                        return;
                    case 'refreshIssues':
                        this.refresh();
                        return;
                    case 'clearIssues':
                        this.clearIssues();
                        return;
                    case 'exportIssues':
                        this.exportIssues();
                        return;
                }
            }
        );

        // Initial load - delay to ensure webview is ready
        setTimeout(() => {
            this.refresh();
        }, 100);
    }

    public refresh(): void {
        console.log('IssuesPanelProvider.refresh() called');
        if (this._view) {
            console.log('Webview exists, getting review results');
            const results = this.codeReviewManager.getReviewResults();
            console.log('Review results:', results.length, 'results found');
            
            // Log detailed information about the results
            if (results.length > 0) {
                results.forEach((result, index) => {
                    console.log(`Result ${index}:`, {
                        timestamp: result.metadata.timestamp,
                        totalIssues: result.summary.totalIssues,
                        issuesCount: result.issues?.length || 0,
                        aiProvider: result.metadata.aiProvider
                    });
                });
            }
            
            // Serialize the results to handle Date objects properly for webview
            const serializedResults = results.map(result => ({
                ...result,
                metadata: {
                    ...result.metadata,
                    timestamp: result.metadata.timestamp.toISOString()
                },
                issues: result.issues.map(issue => ({
                    ...issue,
                    timestamp: issue.timestamp.toISOString()
                }))
            }));
            
            console.log('Serialized results for webview:', serializedResults.length, 'results');
            console.log('First serialized result:', serializedResults[0]);
            
            this._view.webview.postMessage({
                command: 'updateIssues',
                results: serializedResults
            });
            console.log('Posted message to webview with', serializedResults.length, 'results');
        } else {
            console.log('No webview available to refresh');
        }
    }

    private async navigateToIssue(issue: CodeIssue): Promise<void> {
        try {
            const uri = vscode.Uri.file(issue.filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);
            
            // Navigate to the specific line
            const position = new vscode.Position(issue.lineNumber - 1, issue.columnNumber || 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
            
            // Show the issue details in a hover
            const hover = new vscode.Hover([
                `**${issue.severity.toUpperCase()} - ${issue.category}**`,
                issue.description,
                ...issue.suggestions.map(s => `- ${s.description}`)
            ]);
            
            // This would require additional implementation to show hover at position
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to navigate to issue: ${error}`);
        }
    }

    private async clearIssues(): Promise<void> {
        const result = await vscode.window.showWarningMessage(
            'Are you sure you want to clear all review results?',
            { modal: true },
            'Yes', 'No'
        );
        
        if (result === 'Yes') {
            // Clear stored issues
            await this.codeReviewManager.clearReviewResults();
            
            // Set context to hide the issues panel when no issues
            vscode.commands.executeCommand('setContext', 'aiCodeReview.hasIssues', false);
            
            
            // Refresh the view to show empty state
            this.refresh();
            
            vscode.window.showInformationMessage('All review results cleared.');
        }
    }

    private async exportIssues(): Promise<void> {
        try {
            const results = this.codeReviewManager.getReviewResults();
            const data = JSON.stringify(results, null, 2);
            
            const uri = await vscode.window.showSaveDialog({
                saveLabel: 'Export Issues',
                filters: {
                    'JSON Files': ['json']
                }
            });
            
            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(data, 'utf8'));
                vscode.window.showInformationMessage('Issues exported successfully.');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export issues: ${error}`);
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Code Review Issues</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        margin: 0;
                        padding: 10px;
                    }
                    
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    
                    .title {
                        font-size: 16px;
                        font-weight: bold;
                        color: var(--vscode-editor-foreground);
                    }
                    
                    .controls {
                        display: flex;
                        gap: 8px;
                    }
                    
                    button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    
                    .severity-critical { color: #ff6b6b; font-weight: bold; }
                    .severity-high { color: #ffa726; font-weight: bold; }
                    .severity-medium { color: #ffd54f; font-weight: bold; }
                    .severity-low { color: #81c784; }
                    
                    .issue-item {
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        margin-bottom: 8px;
                        padding: 8px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    
                    .issue-item:hover {
                        background-color: var(--vscode-list-hoverBackground);
                    }
                    
                    .issue-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 5px;
                    }
                    
                    .issue-severity {
                        font-size: 11px;
                        padding: 2px 6px;
                        border-radius: 3px;
                        text-transform: uppercase;
                    }
                    
                    .issue-category {
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        background-color: var(--vscode-badge-background);
                        padding: 2px 6px;
                        border-radius: 3px;
                    }
                    
                    .issue-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    
                    .issue-description {
                        color: var(--vscode-descriptionForeground);
                        font-size: 12px;
                        margin-bottom: 5px;
                    }
                    
                    .issue-location {
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                    }
                    
                    .no-issues {
                        text-align: center;
                        color: var(--vscode-descriptionForeground);
                        padding: 20px;
                    }
                    
                    .summary {
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 4px;
                        padding: 10px;
                        margin-bottom: 15px;
                        font-size: 12px;
                    }
                    
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                        text-align: center;
                    }
                    
                    .summary-item {
                        padding: 5px;
                    }
                    
                    .summary-number {
                        font-size: 18px;
                        font-weight: bold;
                        color: var(--vscode-editor-foreground);
                    }
                    
                    .summary-label {
                        font-size: 10px;
                        color: var(--vscode-descriptionForeground);
                        text-transform: uppercase;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">AI Code Review Issues</div>
                    <div class="controls">
                        <button id="refreshBtn">Refresh</button>
                        <button id="exportBtn">Export</button>
                        <button id="clearBtn">Clear</button>
                    </div>
                </div>
                
                <div id="content">
                    <div class="no-issues">No review results available. Start a code review to see issues here.</div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    document.getElementById('refreshBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'refreshIssues' });
                    });
                    
                    document.getElementById('exportBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'exportIssues' });
                    });
                    
                    document.getElementById('clearBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'clearIssues' });
                    });
                    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        console.log('Webview received message:', message.command, message);
                        switch (message.command) {
                            case 'updateIssues':
                                console.log('Updating issues display with:', message.results?.length || 0, 'results');
                                updateIssuesDisplay(message.results);
                                break;
                        }
                    });
                    
                    function updateIssuesDisplay(results) {
                        console.log('Updating issues display with results:', results);
                        console.log('Results type:', typeof results);
                        console.log('Results length:', results ? results.length : 'undefined');
                        
                        const content = document.getElementById('content');
                        
                        if (!results || results.length === 0) {
                            console.log('No results found, showing no-issues message');
                            content.innerHTML = '<div class="no-issues">No review results available. Start a code review to see issues here.</div>';
                            return;
                        }
                        
                        console.log('Processing', results.length, 'results');
                        let html = '';
                        
                        // Calculate summary
                        let totalIssues = 0;
                        let criticalIssues = 0;
                        let highIssues = 0;
                        let mediumIssues = 0;
                        let lowIssues = 0;
                        
                        results.forEach((result, index) => {
                            console.log('Processing result', index, ':', result);
                            if (result.summary) {
                                console.log('Result summary:', result.summary);
                                totalIssues += result.summary.totalIssues || 0;
                                criticalIssues += result.summary.criticalIssues || 0;
                                highIssues += result.summary.highIssues || 0;
                                mediumIssues += result.summary.mediumIssues || 0;
                                lowIssues += result.summary.lowIssues || 0;
                            }
                            if (result.issues) {
                                console.log('Result issues count:', result.issues.length);
                                console.log('Result issues:', result.issues);
                            }
                        });
                        
                        const summary = {
                            totalIssues,
                            criticalIssues,
                            highIssues,
                            mediumIssues,
                            lowIssues
                        };
                        
                        console.log('Calculated summary:', summary);
                        
                        // Add summary
                        if (totalIssues > 0) {
                            html += \`
                                <div class="summary">
                                    <div class="summary-grid">
                                        <div class="summary-item">
                                            <div class="summary-number">\${summary.totalIssues}</div>
                                            <div class="summary-label">Total</div>
                                        </div>
                                        <div class="summary-item">
                                            <div class="summary-number severity-critical">\${summary.criticalIssues}</div>
                                            <div class="summary-label">Critical</div>
                                        </div>
                                        <div class="summary-item">
                                            <div class="summary-number severity-high">\${summary.highIssues}</div>
                                            <div class="summary-label">High</div>
                                        </div>
                                        <div class="summary-item">
                                            <div class="summary-number severity-medium">\${summary.mediumIssues}</div>
                                            <div class="summary-label">Medium</div>
                                        </div>
                                    </div>
                                </div>
                            \`;
                        }
                        
                        // Add issues
                        results.forEach((result, resultIndex) => {
                            if (result.issues && result.issues.length > 0) {
                                console.log('Adding issues from result', resultIndex, ':', result.issues.length, 'issues');
                                result.issues.forEach((issue, issueIndex) => {
                                    console.log('Adding issue', issueIndex, ':', issue);
                                    html += \`
                                        <div class="issue-item" onclick="navigateToIssue('\${JSON.stringify(issue).replace(/"/g, '&quot;')}')">
                                            <div class="issue-header">
                                                <span class="issue-severity severity-\${issue.severity}">\${issue.severity}</span>
                                                <span class="issue-category">\${issue.category}</span>
                                            </div>
                                            <div class="issue-title">\${issue.title}</div>
                                            <div class="issue-description">\${issue.description}</div>
                                            <div class="issue-location">\${issue.filePath}:\${issue.lineNumber}</div>
                                        </div>
                                    \`;
                                });
                            } else {
                                console.log('Result', resultIndex, 'has no issues or empty issues array');
                            }
                        });
                        
                        console.log('Final HTML length:', html.length);
                        console.log('Setting content.innerHTML');
                        content.innerHTML = html;
                        console.log('Content updated successfully');
                    }
                    
                    function navigateToIssue(issueJson) {
                        const issue = JSON.parse(issueJson);
                        vscode.postMessage({ command: 'navigateToIssue', issue: issue });
                    }
                </script>
            </body>
            </html>
        `;
    }

    public dispose(): void {
        // Cleanup resources
    }
}
