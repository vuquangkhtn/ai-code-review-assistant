import * as vscode from 'vscode';

export class WorkflowGuidePanel {
    public static currentPanel: WorkflowGuidePanel | undefined;
    public static readonly viewType = 'workflowGuide';

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (WorkflowGuidePanel.currentPanel) {
            WorkflowGuidePanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            WorkflowGuidePanel.viewType,
            'AI Code Review - Workflow Guide',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        WorkflowGuidePanel.currentPanel = new WorkflowGuidePanel(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        WorkflowGuidePanel.currentPanel = new WorkflowGuidePanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        WorkflowGuidePanel.currentPanel = undefined;

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
        this._panel.title = 'AI Code Review - Workflow Guide';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Code Review - Workflow Guide</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: var(--vscode-textLink-foreground);
            border-bottom: 2px solid var(--vscode-textLink-foreground);
            padding-bottom: 10px;
        }
        .step {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .step-number {
            font-size: 1.2em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .step-title {
            font-size: 1.1em;
            font-weight: bold;
            margin: 5px 0;
        }
        .step-description {
            margin-top: 10px;
        }
        .highlight {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
        }
        .warning {
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .info {
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 AI Code Review Workflow Guide</h1>
        
        <div class="info">
            <strong>📋 Overview:</strong> This extension helps you generate prompts for external AI services to review your code. Follow these steps for the best results.
        </div>

        <div class="step">
            <div class="step-number">Step 1</div>
            <div class="step-title">📝 Copy Prompt for External AI</div>
            <div class="step-description">
                Click the <span class="highlight">"Copy Prompt for External AI"</span> button in the sidebar to generate and copy a comprehensive prompt to your clipboard. This prompt includes:
                <ul>
                    <li>Your code changes or selected files</li>
                    <li>Context about your project</li>
                    <li>Specific instructions for the AI to review your code</li>
                </ul>
            </div>
        </div>

        <div class="step">
            <div class="step-number">Step 2</div>
            <div class="step-title">🤖 Paste to AI Chat</div>
            <div class="step-description">
                Open your preferred AI service (ChatGPT, Claude, Gemini, etc.) and paste the copied prompt. The AI will analyze your code and provide:
                <ul>
                    <li>Code quality feedback</li>
                    <li>Security vulnerability detection</li>
                    <li>Performance optimization suggestions</li>
                    <li>Best practice recommendations</li>
                </ul>
            </div>
        </div>

        <div class="step">
            <div class="step-number">Step 3</div>
            <div class="step-title">📊 Check Scan Result</div>
            <div class="step-description">
                After receiving the AI's response, copy it and save it as a file in the <span class="highlight">.ai-code-review/results</span> folder. Then click the <span class="highlight">"Check Scan Result"</span> button in the sidebar to:
                <ul>
                    <li>View all your saved scan results</li>
                    <li>Compare different AI responses</li>
                    <li>Track your code improvement over time</li>
                </ul>
            </div>
        </div>

        <div class="warning">
            <strong>⚠️ Important:</strong> This extension generates prompts for external AI services. Make sure you're comfortable sharing your code with third-party AI providers and follow your organization's security policies.
        </div>

        <div class="info">
            <strong>💡 Tips:</strong>
            <ul>
                <li>Use different AI services to get varied perspectives on your code</li>
                <li>Save AI responses with descriptive filenames (e.g., "security-review-2024-01-15.md")</li>
                <li>Review the AI suggestions carefully before implementing changes</li>
                <li>Use the Default Change Type settings to focus on specific areas of your codebase</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
    }
}