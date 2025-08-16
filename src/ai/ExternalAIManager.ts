import * as vscode from 'vscode';
import { ReviewRequest, ReviewResult } from '../types';
import { PromptGenerator, PromptResult } from './PromptGenerator';
import { ResponseParser } from './ResponseParser';
import { StorageManager } from '../core/StorageManager';

export class ExternalAIManager {
    private static instance: ExternalAIManager;
    private storageManager: StorageManager;
    private changeDetector?: any; // ChangeDetector instance

    private constructor(storageManager: StorageManager) {
        this.storageManager = storageManager;
    }

    public static getInstance(storageManager: StorageManager): ExternalAIManager {
        if (!ExternalAIManager.instance) {
            ExternalAIManager.instance = new ExternalAIManager(storageManager);
        }
        return ExternalAIManager.instance;
    }

    public setChangeDetector(changeDetector: any): void {
        this.changeDetector = changeDetector;
    }

    /**
     * Copies AI review prompt to clipboard for external AI providers
     * Uses the new workflow: stores changes to file first, then generates prompt referencing that file
     */
    public async copyPromptToClipboard(request: ReviewRequest): Promise<void> {
        try {
            if (!this.changeDetector) {
                vscode.window.showErrorMessage('ChangeDetector not initialized. Please try again.');
                return;
            }
            
            // First, store the changes to a file
            const result = await this.changeDetector.detectAndStoreLocalChanges();
            
            if (!result || !result.filePath) {
                vscode.window.showErrorMessage('Failed to store changes to file. Please try again.');
                return;
            }
            
            const changesFilePath = result.filePath;
            
            // Generate prompt that references the stored changes file
            const promptResult = PromptGenerator.generateFileReferencePrompt(changesFilePath);
            
            await vscode.env.clipboard.writeText(promptResult.content);
            
            if (promptResult.isFileBased && promptResult.filePath) {
                vscode.window.showInformationMessage(
                    `AI review prompt saved and copied to clipboard! The prompt references your code changes stored in: ${changesFilePath}`,
                    'Open Changes File',
                    'Open Prompt File',
                    'Show Quick Prompt'
                ).then(selection => {
                    if (selection === 'Open Changes File') {
                        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(changesFilePath));
                    } else if (selection === 'Open Prompt File') {
                        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(promptResult.filePath!));
                    } else if (selection === 'Show Quick Prompt') {
                        this.showQuickPrompt(request);
                    }
                });
            } else {
                vscode.window.showInformationMessage(
                    `AI review prompt copied to clipboard! Your code changes are stored in: ${changesFilePath}`,
                    'Open Changes File',
                    'Show Quick Prompt'
                ).then(selection => {
                    if (selection === 'Open Changes File') {
                        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(changesFilePath));
                    } else if (selection === 'Show Quick Prompt') {
                        this.showQuickPrompt(request);
                    }
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to copy prompt: ${error}`);
        }
    }

    /**
     * Shows a quick prompt option for simpler AI queries
     */
    public async showQuickPrompt(request: ReviewRequest): Promise<void> {
        try {
            // Use workspace analysis for repository indexing, but not for workspace-prompt
            const isRepositoryIndex = request.changeInfo.source === 'repository-index';
            const isWorkspacePrompt = request.changeInfo.source === 'workspace-prompt';
            
            const quickPrompt = (isRepositoryIndex && !isWorkspacePrompt)
                ? PromptGenerator.generateWorkspaceAnalysisPrompt(request)
                : PromptGenerator.generateQuickPrompt(request);
                
            await vscode.env.clipboard.writeText(quickPrompt);
            
            let message: string;
            if (isRepositoryIndex && !isWorkspacePrompt) {
                message = 'Workspace analysis prompt copied to clipboard! This provides architectural insights for your repository.';
            } else if (isWorkspacePrompt) {
                message = 'Workspace analysis template copied to clipboard! Paste this to your AI to analyze the entire codebase.';
            } else {
                message = 'Quick prompt copied to clipboard! This is a simplified version for faster AI analysis.';
            }
                
            vscode.window.showInformationMessage(message);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to copy quick prompt: ${error}`);
        }
    }

    /**
     * Shows input box for pasting AI response and processes it
     */
    public async pasteAndProcessResponse(request: ReviewRequest): Promise<ReviewResult | null> {
        try {
            const response = await vscode.window.showInputBox({
                prompt: 'Paste the AI response here',
                placeHolder: 'Paste the complete response from your AI provider...',
                ignoreFocusOut: true,
                value: '',
                validateInput: (value) => {
                    if (!value || value.trim().length < 10) {
                        return 'Please paste a valid AI response (at least 10 characters)';
                    }
                    return null;
                }
            });

            if (!response) {
                return null;
            }

            return this.processAIResponse(response, request);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to process AI response: ${error}`);
            return null;
        }
    }

    /**
     * Processes AI response text and converts to ReviewResult
     */
    public processAIResponse(responseText: string, request: ReviewRequest): ReviewResult | null {
        try {
            const filesReviewed = request.changeInfo.files.map(f => f.path);
            const result = ResponseParser.parseResponse(
                responseText,
                'external-ai',
                filesReviewed
            );

            if (!result) {
                vscode.window.showErrorMessage(
                    'Failed to parse AI response. Please ensure the response is in the correct format.'
                );
                return null;
            }

            // Store the result
            this.storageManager.saveReviewResult(result);

            vscode.window.showInformationMessage(
                `Successfully processed AI response: ${result.issues.length} issues found.`
            );

            return result;
        } catch (error) {
            vscode.window.showErrorMessage(`Error processing AI response: ${error}`);
            return null;
        }
    }

    /**
     * Shows a webview for easier response pasting with syntax highlighting
     */
    public async showResponseInputWebview(request: ReviewRequest): Promise<ReviewResult | null> {
        return new Promise((resolve) => {
            const panel = vscode.window.createWebviewPanel(
                'aiResponseInput',
                'Paste AI Response',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = this.getWebviewContent();

            panel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case 'submitResponse': {
                            const result = this.processAIResponse(message.response, request);
                            panel.dispose();
                            resolve(result);
                            break;
                        }
                        case 'cancel': {
                            panel.dispose();
                            resolve(null);
                            break;
                        }
                    }
                }
            );

            panel.onDidDispose(() => {
                resolve(null);
            });
        });
    }

    /**
     * Generates HTML content for the response input webview
     */
    private getWebviewContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Paste AI Response</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: var(--vscode-foreground);
                        margin-bottom: 20px;
                    }
                    .instructions {
                        background-color: var(--vscode-textBlockQuote-background);
                        border-left: 4px solid var(--vscode-textBlockQuote-border);
                        padding: 15px;
                        margin-bottom: 20px;
                    }
                    textarea {
                        width: 100%;
                        height: 400px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        padding: 10px;
                        font-family: var(--vscode-editor-font-family);
                        font-size: var(--vscode-editor-font-size);
                        resize: vertical;
                    }
                    .button-container {
                        margin-top: 20px;
                        display: flex;
                        gap: 10px;
                    }
                    button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 10px 20px;
                        cursor: pointer;
                        border-radius: 2px;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .secondary {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .secondary:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Paste AI Response</h1>
                    <div class="instructions">
                        <strong>Instructions:</strong>
                        <ul>
                            <li>Paste the complete response from your AI provider below</li>
                            <li>The response can be in JSON format or plain text</li>
                            <li>Make sure to include all issues and suggestions</li>
                        </ul>
                    </div>
                    <textarea id="responseInput" placeholder="Paste your AI response here..."></textarea>
                    <div class="button-container">
                        <button onclick="submitResponse()">Process Response</button>
                        <button class="secondary" onclick="cancel()">Cancel</button>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function submitResponse() {
                        const response = document.getElementById('responseInput').value;
                        if (!response || response.trim().length < 10) {
                            alert('Please paste a valid AI response (at least 10 characters)');
                            return;
                        }
                        vscode.postMessage({
                            command: 'submitResponse',
                            response: response
                        });
                    }

                    function cancel() {
                        vscode.postMessage({
                            command: 'cancel'
                        });
                    }

                    // Auto-focus the textarea
                    document.getElementById('responseInput').focus();
                </script>
            </body>
            </html>
        `;
    }

    /**
     * Shows format examples to help users understand expected response format
     */
    public async showFormatExamples(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'aiResponseFormat',
            'AI Response Format Examples',
            vscode.ViewColumn.One,
            {
                enableScripts: false,
                retainContextWhenHidden: false
            }
        );

        panel.webview.html = this.getFormatExamplesContent();
    }

    /**
     * Generates HTML content for format examples
     */
    private getFormatExamplesContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Response Format Examples</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        line-height: 1.6;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1, h2 {
                        color: var(--vscode-foreground);
                    }
                    pre {
                        background-color: var(--vscode-textPreformat-background);
                        border: 1px solid var(--vscode-textPreformat-border);
                        padding: 15px;
                        overflow-x: auto;
                        border-radius: 4px;
                    }
                    code {
                        font-family: var(--vscode-editor-font-family);
                        font-size: var(--vscode-editor-font-size);
                    }
                    .example {
                        margin-bottom: 30px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>AI Response Format Examples</h1>
                    
                    <div class="example">
                        <h2>JSON Format (Recommended)</h2>
                        <pre><code>{
  "issues": [
    {
      "type": "security",
      "severity": "high",
      "file": "src/auth.js",
      "line": 42,
      "title": "Potential SQL Injection",
      "description": "User input is directly concatenated into SQL query without sanitization",
      "suggestion": "Use parameterized queries or prepared statements"
    },
    {
      "type": "performance",
      "severity": "medium",
      "file": "src/utils.js",
      "line": 15,
      "title": "Inefficient Loop",
      "description": "Nested loops could be optimized",
      "suggestion": "Consider using a hash map for O(1) lookups"
    }
  ],
  "summary": "Found 2 issues: 1 high severity security issue and 1 medium performance issue"
}</code></pre>
                    </div>

                    <div class="example">
                        <h2>Plain Text Format</h2>
                        <pre><code>1. HIGH: Potential SQL Injection
   File: src/auth.js, Line: 42
   Description: User input is directly concatenated into SQL query
   Suggestion: Use parameterized queries

2. MEDIUM: Inefficient Loop
   File: src/utils.js, Line: 15
   Description: Nested loops could be optimized
   Suggestion: Use hash map for better performance</code></pre>
                    </div>

                    <div class="example">
                        <h2>Supported Issue Types</h2>
                        <ul>
                            <li><strong>security</strong> - Security vulnerabilities</li>
                            <li><strong>performance</strong> - Performance issues</li>
                            <li><strong>bug</strong> - Code quality and bugs</li>
                            <li><strong>style</strong> - Code style issues</li>
                            <li><strong>maintainability</strong> - Maintainability concerns</li>
                            <li><strong>best-practices</strong> - Best practice violations</li>
                            <li><strong>testing</strong> - Testing related issues</li>
                            <li><strong>documentation</strong> - Documentation issues</li>
                        </ul>
                    </div>

                    <div class="example">
                        <h2>Supported Severity Levels</h2>
                        <ul>
                            <li><strong>critical</strong> - Critical issues that must be fixed</li>
                            <li><strong>high</strong> - High priority issues</li>
                            <li><strong>medium</strong> - Medium priority issues</li>
                            <li><strong>low</strong> - Low priority issues</li>
                        </ul>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Prompts user to select a JSON file containing AI review results and processes it
     */
    public async checkReviewResultFromFile(): Promise<ReviewResult | null> {
        try {
            // Show file picker for JSON files
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                },
                openLabel: 'Select AI Review Result File'
            });

            if (!fileUri || fileUri.length === 0) {
                return null;
            }

            // Read the file content
            const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
            const responseText = Buffer.from(fileContent).toString('utf8');

            // Create a dummy request for processing (we only need it for metadata)
            const dummyRequest: ReviewRequest = {
                changeInfo: {
                    type: 'LOCAL' as any,
                    source: 'file-based-review',
                    files: []
                },
                aiProvider: 'external-ai',
                options: {
                    severityThreshold: 'medium' as any,
                    includeCodeExamples: true,
                    includeSuggestions: true,
                    maxIssuesPerFile: 50
                }
            };

            // Process the response
            const result = this.processAIResponse(responseText, dummyRequest);
            
            if (result) {
                vscode.window.showInformationMessage(
                    `Successfully processed review result with ${result.issues.length} issues.`
                );
            } else {
                vscode.window.showErrorMessage('Failed to parse the review result file. Please check the JSON format.');
            }

            return result;
        } catch (error) {
            vscode.window.showErrorMessage(`Error reading review result file: ${error}`);
            return null;
        }
    }
}