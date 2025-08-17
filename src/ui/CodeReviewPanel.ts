import * as vscode from 'vscode';
import { ReviewResult, CodeIssue } from '../types';


export class CodeReviewPanel {
    public static currentPanel: CodeReviewPanel | undefined;
    public static readonly viewType = 'aiCodeReview.panel';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _currentIssues: CodeIssue[] = [];
    private _reviewHistory: ReviewResult[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (CodeReviewPanel.currentPanel) {
            CodeReviewPanel.currentPanel._panel.reveal(column);
            return CodeReviewPanel.currentPanel;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            CodeReviewPanel.viewType,
            'AI Code Review',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        CodeReviewPanel.currentPanel = new CodeReviewPanel(panel, extensionUri);
        return CodeReviewPanel.currentPanel;
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        CodeReviewPanel.currentPanel = new CodeReviewPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openFile':
                        this._openFile(message.file, message.line);
                        return;
                    case 'filterIssues':
                        this._filterIssues(message.severity);
                        return;
                    case 'exportReview':
                        this._exportReview(message.reviewId);
                        return;
                    case 'clearHistory':
                        this._clearHistory();
                        return;

                }
            },
            null,
            this._disposables
        );
    }

    public updateIssues(issues: CodeIssue[]) {
        this._currentIssues = issues;
        this._panel.webview.postMessage({
            command: 'updateIssues',
            issues: this._currentIssues
        });
    }

    public addReviewToHistory(review: ReviewResult) {
        this._reviewHistory.unshift(review);
        if (this._reviewHistory.length > 50) {
            this._reviewHistory = this._reviewHistory.slice(0, 50);
        }
        this._panel.webview.postMessage({
            command: 'updateHistory',
            history: this._reviewHistory
        });
    }

    public clearIssues() {
        this._currentIssues = [];
        this._panel.webview.postMessage({
            command: 'clearIssues'
        });
    }

    private _openFile(file: string, line?: number) {
        // Ensure file path is absolute
        let absolutePath = file;
        if (!absolutePath.startsWith('/') && !absolutePath.match(/^[a-zA-Z]:/)) {
            // Relative path - join with workspace root
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                absolutePath = vscode.Uri.joinPath(workspaceFolder.uri, file).fsPath;
            }
        }
        
        const uri = vscode.Uri.file(absolutePath);
        vscode.window.showTextDocument(uri).then(editor => {
            if (line && line > 0) {
                const position = new vscode.Position(line - 1, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
            }
        });
    }

    private _filterIssues(severity: string) {
        let filteredIssues = this._currentIssues;
        if (severity !== 'all') {
            filteredIssues = this._currentIssues.filter(issue => issue.severity === severity);
        }
        this._panel.webview.postMessage({
            command: 'updateIssues',
            issues: filteredIssues
        });
    }

    private async _exportReview(reviewId: string) {
        const review = this._reviewHistory.find(r => r.metadata?.timestamp?.toString() === reviewId);
        if (!review) return;

        const exportData = {
            timestamp: review.metadata.timestamp,
            changeType: review.metadata.changeType,
            aiProvider: review.metadata.aiProvider,
            summary: review.summary,
            issues: review.issues,
            metadata: review.metadata
        };

        const content = JSON.stringify(exportData, null, 2);
        const fileName = `code-review-${new Date().toISOString().split('T')[0]}.json`;
        
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

    private _clearHistory() {
        this._reviewHistory = [];
        this._panel.webview.postMessage({
            command: 'updateHistory',
            history: []
        });
    }



    public dispose() {
        CodeReviewPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Code Review</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
        }
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .tabs {
            display: flex;
            background: var(--vscode-tab-inactiveBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: var(--vscode-tab-inactiveBackground);
            color: var(--vscode-tab-inactiveForeground);
            border-bottom: 2px solid transparent;
        }
        .tab.active {
            background: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
            border-bottom-color: var(--vscode-focusBorder);
        }
        .tab:hover {
            background: var(--vscode-tab-hoverBackground);
        }
        .tab-content {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
        }
        .tab-panel {
            display: none;
        }
        .tab-panel.active {
            display: block;
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
        .filter-buttons {
            display: flex;
            gap: 5px;
        }
        .filter-btn {
            padding: 4px 8px;
            border: 1px solid var(--vscode-button-border);
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 11px;
            border-radius: 3px;
        }
        .filter-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .filter-btn.active {
            background: var(--vscode-button-secondaryBackground);
        }
        .issue-item {
            margin-bottom: 12px;
            padding: 10px;
            border-left: 3px solid;
            background: var(--vscode-editor-inactiveSelectionBackground);
            cursor: pointer;
            border-radius: 3px;
        }
        .issue-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .issue-item.critical {
            border-left-color: #9b59b6;
        }
        .issue-item.high {
            border-left-color: #e74c3c;
        }
        .issue-item.medium {
            border-left-color: #f1c40f;
        }
        .issue-item.low {
            border-left-color: #3498db;
        }
        .issue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        .issue-title {
            font-weight: bold;
            font-size: 13px;
        }
        .issue-severity {
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: bold;
        }
        .severity-critical {
            background: #9b59b6;
            color: white;
        }
        .severity-high {
            background: #e74c3c;
            color: white;
        }
        .severity-medium {
            background: #f1c40f;
            color: #2c3e50;
        }
        .severity-low {
            background: #3498db;
            color: white;
        }
        .issue-description {
            margin-bottom: 5px;
            font-size: 12px;
            line-height: 1.4;
        }
        .issue-location {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-family: var(--vscode-editor-font-family);
        }
        .no-content {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            margin-top: 50px;
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
        .stat-critical { color: #9b59b6; }
        .stat-high { color: #e74c3c; }
        .stat-medium { color: #f1c40f; }
        .stat-low { color: #3498db; }

    </style>
</head>
<body>
    <div class="container">

        
        <div class="tabs">
            <button class="tab active" onclick="switchTab('issues')">Issues</button>
            <button class="tab" onclick="switchTab('history')">History</button>
        </div>
        
        <div class="tab-content">
            <!-- Issues Tab -->
            <div id="issues-panel" class="tab-panel active">
                <div class="header">
                    <div class="title">Code Review Issues</div>
                    <div class="filter-buttons">
                        <button class="filter-btn active" onclick="filterIssues('all')">All</button>
                        <button class="filter-btn" onclick="filterIssues('critical')">Critical</button>
                        <button class="filter-btn" onclick="filterIssues('high')">High</button>
                        <button class="filter-btn" onclick="filterIssues('medium')">Medium</button>
                        <button class="filter-btn" onclick="filterIssues('low')">Low</button>
                    </div>
                </div>
                <div id="issues-container">
                    <div class="no-content">No issues found. Run a code review to see results here.</div>
                </div>
            </div>
            
            <!-- History Tab -->
            <div id="history-panel" class="tab-panel">
                <div class="header">
                    <div class="title">Review History</div>
                    <button class="filter-btn" onclick="clearHistory()">Clear All</button>
                </div>
                <div id="history-container">
                    <div class="no-content">No review history yet. Complete a code review to see results here.</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentIssues = [];
        let reviewHistory = [];
        let currentFilter = 'all';

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateIssues':
                    currentIssues = message.issues;
                    renderIssues(currentIssues);
                    break;
                case 'clearIssues':
                    currentIssues = [];
                    renderIssues([]);
                    break;
                case 'updateHistory':
                    reviewHistory = message.history;
                    renderHistory(reviewHistory);
                    break;

            }
        });

        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');

            // Update tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            document.getElementById(tabName + '-panel').classList.add('active');
        }

        function renderIssues(issues) {
            const container = document.getElementById('issues-container');
            
            if (issues.length === 0) {
                container.innerHTML = '<div class="no-content">No issues found. Run a code review to see results here.</div>';
                return;
            }

            container.innerHTML = issues.map(issue => \`
                <div class="issue-item \${issue.severity}" onclick="openFile('\${issue.filePath}', \${issue.lineNumber})">
                    <div class="issue-header">
                        <div class="issue-title">\${escapeHtml(issue.title)}</div>
                        <div class="issue-severity severity-\${issue.severity}">\${issue.severity}</div>
                    </div>
                    <div class="issue-description">\${escapeHtml(issue.description)}</div>
                    <div class="issue-location">\${issue.filePath}:\${issue.lineNumber}</div>
                </div>
            \`).join('');
        }

        function renderHistory(history) {
            const container = document.getElementById('history-container');
            
            if (history.length === 0) {
                container.innerHTML = '<div class="no-content">No review history yet. Complete a code review to see results here.</div>';
                return;
            }

            container.innerHTML = history.map(review => {
                const date = new Date(review.metadata.timestamp);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                const reviewId = review.metadata.timestamp.toString();
                
                return \`
                    <div class="history-item">
                        <div class="review-header">
                            <div class="review-info">
                                <div class="review-date">\${dateStr}</div>
                                <div class="review-meta">\${review.metadata.changeType} • \${review.metadata.aiProvider}</div>
                            </div>
                            <div class="review-actions">
                                <button class="action-btn load" onclick="loadReview('\${reviewId}')">Load</button>
                                <button class="action-btn" onclick="exportReview('\${reviewId}')">Export</button>
                            </div>
                        </div>
                        <div class="review-summary">Total Issues: \${review.summary.totalIssues}, Critical: \${review.summary.criticalIssues}</div>
                        <div class="review-stats">
                            \${review.summary.criticalIssues > 0 ? \`<div class="stat-item stat-critical">Critical: \${review.summary.criticalIssues}</div>\` : ''}
                            \${review.summary.highIssues > 0 ? \`<div class="stat-item stat-high">High: \${review.summary.highIssues}</div>\` : ''}
                            \${review.summary.mediumIssues > 0 ? \`<div class="stat-item stat-medium">Medium: \${review.summary.mediumIssues}</div>\` : ''}
                            \${review.summary.lowIssues > 0 ? \`<div class="stat-item stat-low">Low: \${review.summary.lowIssues}</div>\` : ''}
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function openFile(file, line) {
            vscode.postMessage({
                command: 'openFile',
                file: file,
                line: line
            });
        }

        function filterIssues(severity) {
            currentFilter = severity;
            
            // Update button states
            document.querySelectorAll('#issues-panel .filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');

            vscode.postMessage({
                command: 'filterIssues',
                severity: severity
            });
        }

        function loadReview(reviewId) {
            const review = reviewHistory.find(r => r.metadata.timestamp.toString() === reviewId);
            if (review) {
                currentIssues = review.issues;
                renderIssues(currentIssues);
                switchTab('issues');
            }
        }

        function exportReview(reviewId) {
            vscode.postMessage({
                command: 'exportReview',
                reviewId: reviewId
            });
        }

        function clearHistory() {
            if (confirm('Are you sure you want to clear all review history?')) {
                vscode.postMessage({
                    command: 'clearHistory'
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