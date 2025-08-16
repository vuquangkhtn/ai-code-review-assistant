import * as vscode from 'vscode';
import { CodeReviewManager } from '../core/CodeReviewManager';
import { ReviewResult, CodeIssue } from '../types';

export class ReviewHistoryProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiCodeReview.reviewHistory';
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
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case 'refreshHistory':
                    this.refresh();
                    break;
                case 'clearHistory':
                    await this.clearHistory();
                    break;
                case 'exportHistory':
                    await this.exportHistory();
                    break;
                case 'viewReviewDetails':
                    await this.viewReviewDetails(data.reviewId);
                    break;
                case 'deleteReview':
                    await this.deleteReview(data.reviewId);
                    break;
            }
        });

        // Initial load
        this.refresh();
    }

    public refresh(): void {
        console.log('ReviewHistoryProvider.refresh() called');
        if (this._view) {
            const results = this.codeReviewManager.getReviewResults();
            console.log('Sending review history to webview:', results.length, 'results');
            this._view.webview.postMessage({
                command: 'updateHistory',
                results: results
            });
            console.log('Posted history message to webview');
        } else {
            console.log('No webview available to refresh history');
        }
    }

    private async viewReviewDetails(reviewId: string): Promise<void> {
        try {
            const results = this.codeReviewManager.getReviewResults();
            const review = results.find(r => r.metadata.timestamp.getTime().toString() === reviewId);
            
            if (review) {
                // Create a new document to show the review details
                const content = this.formatReviewDetails(review);
                const doc = await vscode.workspace.openTextDocument({
                    content: content,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc);
            } else {
                vscode.window.showErrorMessage('Review not found');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to view review details: ${error}`);
        }
    }

    private formatReviewDetails(review: ReviewResult): string {
        const timestamp = review.metadata.timestamp.toLocaleString();
        let content = `# Code Review Details\n\n`;
        content += `**Date:** ${timestamp}\n`;
        content += `**AI Provider:** ${review.metadata.aiProvider}\n`;
        content += `**Total Issues:** ${review.summary.totalIssues}\n`;
        content += `**Critical:** ${review.summary.criticalIssues} | **High:** ${review.summary.highIssues} | **Medium:** ${review.summary.mediumIssues} | **Low:** ${review.summary.lowIssues}\n\n`;
        
        if (review.issues.length > 0) {
            content += `## Issues Found\n\n`;
            review.issues.forEach((issue, index) => {
                content += `### ${index + 1}. ${issue.title}\n`;
                content += `**File:** ${issue.filePath}:${issue.lineNumber}\n`;
                content += `**Severity:** ${issue.severity.toUpperCase()}\n`;
                content += `**Category:** ${issue.category}\n`;
                content += `**Description:** ${issue.description}\n`;
                if (issue.suggestions.length > 0) {
                    content += `**Suggestions:**\n`;
                    issue.suggestions.forEach(suggestion => {
                        content += `- ${suggestion.description}\n`;
                    });
                }
                content += `\n---\n\n`;
            });
        } else {
            content += `## No Issues Found\n\nThis review found no issues in the analyzed code.\n`;
        }
        
        return content;
    }

    private async deleteReview(reviewId: string): Promise<void> {
        const result = await vscode.window.showWarningMessage(
            'Are you sure you want to delete this review?',
            { modal: true },
            'Yes', 'No'
        );
        
        if (result === 'Yes') {
            try {
                const results = this.codeReviewManager.getReviewResults();
                const review = results.find(r => r.metadata.timestamp.getTime().toString() === reviewId);
                
                if (review) {
                    // Note: We would need to add a deleteReviewResult method to StorageManager
                    // For now, we'll show a message that this feature needs implementation
                    vscode.window.showInformationMessage('Delete functionality will be implemented in StorageManager');
                    // await this.storageManager.deleteReviewResult(review.metadata.timestamp);
                    // this.refresh();
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to delete review: ${error}`);
            }
        }
    }

    private async clearHistory(): Promise<void> {
        const result = await vscode.window.showWarningMessage(
            'Are you sure you want to clear all review history?',
            { modal: true },
            'Yes', 'No'
        );
        
        if (result === 'Yes') {
            await this.codeReviewManager.clearReviewResults();
            this.refresh();
            vscode.window.showInformationMessage('Review history cleared.');
        }
    }

    private async exportHistory(): Promise<void> {
        try {
            const results = this.codeReviewManager.getReviewResults();
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
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export review history: ${error}`);
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Code Review History</title>
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
                    
                    .review-item {
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        margin-bottom: 8px;
                        padding: 12px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    
                    .review-item:hover {
                        background-color: var(--vscode-list-hoverBackground);
                    }
                    
                    .review-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                    }
                    
                    .review-date {
                        font-weight: bold;
                        color: var(--vscode-editor-foreground);
                    }
                    
                    .review-actions {
                        display: flex;
                        gap: 4px;
                    }
                    
                    .action-btn {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: none;
                        padding: 2px 6px;
                        border-radius: 2px;
                        cursor: pointer;
                        font-size: 10px;
                    }
                    
                    .action-btn:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }
                    
                    .review-summary {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 8px;
                        margin-bottom: 8px;
                        font-size: 11px;
                    }
                    
                    .summary-item {
                        text-align: center;
                        padding: 4px;
                        border-radius: 2px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                    }
                    
                    .summary-number {
                        font-weight: bold;
                        font-size: 14px;
                    }
                    
                    .summary-label {
                        font-size: 9px;
                        color: var(--vscode-descriptionForeground);
                        text-transform: uppercase;
                    }
                    
                    .severity-critical { color: #ff6b6b; }
                    .severity-high { color: #ffa726; }
                    .severity-medium { color: #ffd54f; }
                    .severity-low { color: #81c784; }
                    
                    .review-provider {
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        background-color: var(--vscode-badge-background);
                        padding: 2px 6px;
                        border-radius: 3px;
                        display: inline-block;
                    }
                    
                    .no-history {
                        text-align: center;
                        color: var(--vscode-descriptionForeground);
                        padding: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">Review History</div>
                    <div class="controls">
                        <button id="refreshBtn">Refresh</button>
                        <button id="exportBtn">Export</button>
                        <button id="clearBtn">Clear All</button>
                    </div>
                </div>
                
                <div id="content">
                    <div class="no-history">No review history available. Run a code review to see results here.</div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    document.getElementById('refreshBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'refreshHistory' });
                    });
                    
                    document.getElementById('exportBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'exportHistory' });
                    });
                    
                    document.getElementById('clearBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'clearHistory' });
                    });
                    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateHistory':
                                updateHistoryDisplay(message.results);
                                break;
                        }
                    });
                    
                    function updateHistoryDisplay(results) {
                        const content = document.getElementById('content');
                        
                        if (!results || results.length === 0) {
                            content.innerHTML = '<div class="no-history">No review history available. Run a code review to see results here.</div>';
                            return;
                        }
                        
                        let html = '';
                        
                        // Sort results by timestamp (newest first)
                        const sortedResults = results.sort((a, b) => new Date(b.metadata.timestamp) - new Date(a.metadata.timestamp));
                        
                        sortedResults.forEach(result => {
                            const reviewId = new Date(result.metadata.timestamp).getTime().toString();
                            const date = new Date(result.metadata.timestamp).toLocaleString();
                            
                            html += '<div class="review-item">' +
                                    '<div class="review-header">' +
                                        '<div class="review-date">' + date + '</div>' +
                                        '<div class="review-actions">' +
                                            '<button class="action-btn" onclick="viewDetails("' + reviewId + '")">View</button>' +
                                            '<button class="action-btn" onclick="deleteReview("' + reviewId + '")">Delete</button>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="review-summary">' +
                                        '<div class="summary-item">' +
                                            '<div class="summary-number">' + result.summary.totalIssues + '</div>' +
                                            '<div class="summary-label">Total</div>' +
                                        '</div>' +
                                        '<div class="summary-item">' +
                                            '<div class="summary-number severity-critical">' + result.summary.criticalIssues + '</div>' +
                                            '<div class="summary-label">Critical</div>' +
                                        '</div>' +
                                        '<div class="summary-item">' +
                                            '<div class="summary-number severity-high">' + result.summary.highIssues + '</div>' +
                                            '<div class="summary-label">High</div>' +
                                        '</div>' +
                                        '<div class="summary-item">' +
                                            '<div class="summary-number severity-medium">' + result.summary.mediumIssues + '</div>' +
                                            '<div class="summary-label">Medium</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="review-provider">AI Provider: ' + result.metadata.aiProvider + '</div>' +
                                '</div>';
                        });
                        
                        content.innerHTML = html;
                    }
                    
                    function viewDetails(reviewId) {
                        vscode.postMessage({ command: 'viewReviewDetails', reviewId: reviewId });
                    }
                    
                    function deleteReview(reviewId) {
                        vscode.postMessage({ command: 'deleteReview', reviewId: reviewId });
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