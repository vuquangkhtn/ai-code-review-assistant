import * as vscode from 'vscode';
import { ReviewResult } from '../types';

interface ReviewHistoryItem {
    id: string;
    timestamp: Date;
    result: ReviewResult;
}

export class ReviewHistoryProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiCodeReview.reviewHistory';
    private _view?: vscode.WebviewView;
    private _history: ReviewHistoryItem[] = [];

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'loadReview':
                    this._loadReview(data.reviewId);
                    break;
                case 'deleteReview':
                    this._deleteReview(data.reviewId);
                    break;
                case 'exportReview':
                    this._exportReview(data.reviewId);
                    break;
            }
        });
    }

    public addReview(review: ReviewResult) {
        const historyItem: ReviewHistoryItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            result: review
        };
        this._history.unshift(historyItem); // Add to beginning
        if (this._history.length > 50) { // Keep only last 50 reviews
            this._history = this._history.slice(0, 50);
        }
        this._updateView();
    }

    public clearHistory() {
        this._history = [];
        this._updateView();
    }

    public getHistory(): ReviewHistoryItem[] {
        return [...this._history];
    }

    private _updateView() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateHistory',
                history: this._history
            });
        }
    }

    private _loadReview(reviewId: string) {
        const historyItem = this._history.find(r => r.id === reviewId);
        if (historyItem) {
            // Emit event to load this review in the issues panel
            vscode.commands.executeCommand('aiCodeReview.loadReviewResult', historyItem.result);
        }
    }

    private _deleteReview(reviewId: string) {
        this._history = this._history.filter(r => r.id !== reviewId);
        this._updateView();
    }

    private async _exportReview(reviewId: string) {
        const historyItem = this._history.find(r => r.id === reviewId);
        if (!historyItem) return;

        const exportData = {
            id: historyItem.id,
            timestamp: historyItem.timestamp,
            changeType: historyItem.result.metadata.changeType,
            aiProvider: historyItem.result.metadata.aiProvider,
            summary: historyItem.result.summary,
            issues: historyItem.result.issues,
            metadata: historyItem.result.metadata
        };

        const content = JSON.stringify(exportData, null, 2);
        const fileName = `code-review-${historyItem.id}-${historyItem.timestamp.toISOString().split('T')[0]}.json`;
        
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(fileName),
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            }
        });

        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
            vscode.window.showInformationMessage(`Review exported to ${uri.fsPath}`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Review History</title>
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
            font-weight: bold;
            font-size: 14px;
        }
        .clear-btn {
            padding: 4px 8px;
            border: 1px solid var(--vscode-button-border);
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 11px;
            border-radius: 3px;
        }
        .clear-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .history-item {
            margin-bottom: 10px;
            padding: 12px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 5px;
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        .history-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .review-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .review-info {
            flex: 1;
        }
        .review-date {
            font-weight: bold;
            font-size: 12px;
            color: var(--vscode-textLink-foreground);
        }
        .review-meta {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
        }
        .review-actions {
            display: flex;
            gap: 5px;
        }
        .action-btn {
            padding: 2px 6px;
            border: 1px solid var(--vscode-button-border);
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 10px;
            border-radius: 2px;
        }
        .action-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .action-btn.load {
            background: var(--vscode-button-secondaryBackground);
        }
        .action-btn.delete {
            background: var(--vscode-errorForeground);
            color: white;
            border-color: var(--vscode-errorForeground);
        }
        .review-summary {
            font-size: 11px;
            line-height: 1.4;
            margin-bottom: 5px;
        }
        .review-stats {
            display: flex;
            gap: 10px;
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
        }
        .stat-item {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .stat-critical { color: #ff4444; }
        .stat-high { color: #ff8800; }
        .stat-medium { color: #ffcc00; }
        .stat-low { color: #00aa00; }
        .no-history {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            margin-top: 50px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Review History</div>
        <button class="clear-btn" onclick="clearHistory()">Clear All</button>
    </div>
    <div id="history-container">
        <div class="no-history">No review history yet. Complete a code review to see results here.</div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let reviewHistory = [];

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'updateHistory':
                    reviewHistory = message.history;
                    renderHistory(reviewHistory);
                    break;
            }
        });

        function renderHistory(history) {
            const container = document.getElementById('history-container');
            
            if (history.length === 0) {
                container.innerHTML = '<div class="no-history">No review history yet. Complete a code review to see results here.</div>';
                return;
            }

            container.innerHTML = history.map(historyItem => {
                const date = new Date(historyItem.timestamp);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                
                const stats = getIssueStats(historyItem.result.issues || []);
                const summaryText = historyItem.result.summary ? 
                    \`Total: \${historyItem.result.summary.totalIssues}, Critical: \${historyItem.result.summary.criticalIssues}, High: \${historyItem.result.summary.highIssues}\` :
                    'No summary available';
                
                return \`
                    <div class="history-item">
                        <div class="review-header">
                            <div class="review-info">
                                <div class="review-date">\${dateStr}</div>
                                <div class="review-meta">\${historyItem.result.metadata.changeType} • \${historyItem.result.metadata.aiProvider}</div>
                            </div>
                            <div class="review-actions">
                                <button class="action-btn load" onclick="loadReview('\${historyItem.id}')">Load</button>
                                <button class="action-btn" onclick="exportReview('\${historyItem.id}')">Export</button>
                                <button class="action-btn delete" onclick="deleteReview('\${historyItem.id}')">Delete</button>
                            </div>
                        </div>
                        <div class="review-summary">\${escapeHtml(summaryText)}</div>
                        <div class="review-stats">
                            \${stats.critical > 0 ? \`<div class="stat-item stat-critical">Critical: \${stats.critical}</div>\` : ''}
                            \${stats.high > 0 ? \`<div class="stat-item stat-high">High: \${stats.high}</div>\` : ''}
                            \${stats.medium > 0 ? \`<div class="stat-item stat-medium">Medium: \${stats.medium}</div>\` : ''}
                            \${stats.low > 0 ? \`<div class="stat-item stat-low">Low: \${stats.low}</div>\` : ''}
                            <div class="stat-item">Total Issues: \${stats.total}</div>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function getIssueStats(issues) {
            const stats = { critical: 0, high: 0, medium: 0, low: 0, total: issues.length };
            issues.forEach(issue => {
                if (stats.hasOwnProperty(issue.severity)) {
                    stats[issue.severity]++;
                }
            });
            return stats;
        }

        function loadReview(reviewId) {
            vscode.postMessage({
                type: 'loadReview',
                reviewId: reviewId
            });
        }

        function deleteReview(reviewId) {
            if (confirm('Are you sure you want to delete this review?')) {
                vscode.postMessage({
                    type: 'deleteReview',
                    reviewId: reviewId
                });
            }
        }

        function exportReview(reviewId) {
            vscode.postMessage({
                type: 'exportReview',
                reviewId: reviewId
            });
        }

        function clearHistory() {
            if (confirm('Are you sure you want to clear all review history?')) {
                vscode.postMessage({
                    type: 'clearHistory'
                });
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
    }
}