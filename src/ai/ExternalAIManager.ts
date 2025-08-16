import * as vscode from 'vscode';
import { ReviewRequest, ReviewResult, ChangeInfo } from '../types';
import { PromptGenerator, PromptResult } from './PromptGenerator';
import { ResponseParser } from './ResponseParser';
import { CleanupManager } from '../utils/CleanupManager';
import * as path from 'path';
import * as fs from 'fs';


export class ExternalAIManager {
    private static instance: ExternalAIManager;
    private changeDetector?: any; // ChangeDetector instance
    private lastPromptFilePath?: string;
    private lastChangeFilePath?: string;

    private constructor() {
    }

    public static getInstance(): ExternalAIManager {
        if (!ExternalAIManager.instance) {
            ExternalAIManager.instance = new ExternalAIManager();
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
            
            // Clean up previous AI review files before starting new review
            await this.cleanupPreviousFiles();
            
            // Store the changes to a file based on the request type
            let result;
            if (request.changeInfo.type === 'all-files') {
                // For all files, use detectWorkspaceFiles logic
                const changeInfo = await this.changeDetector.detectWorkspaceFiles();
                result = { changeInfo, filePath: await this.storeChangesToFile(changeInfo) };
            } else {
                // For local changes, use the existing method
                result = await this.changeDetector.detectAndStoreLocalChanges();
            }
            
            if (!result || !result.filePath) {
                vscode.window.showErrorMessage('Failed to store changes to file. Please try again.');
                return;
            }
            
            const changesFilePath = result.filePath;
            
            // Generate prompt that references the stored changes file
            const promptResult = PromptGenerator.generateFileReferencePrompt(changesFilePath);
            
            // Store file paths for later access
            this.lastChangeFilePath = changesFilePath;
            if (promptResult.isFileBased && promptResult.filePath) {
                this.lastPromptFilePath = promptResult.filePath;
            }
            
            await vscode.env.clipboard.writeText(promptResult.content);
            
            // Show simple information message with no action buttons
            vscode.window.showInformationMessage('Prompt copied to clipboard!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to copy prompt: ${error}`);
        }
    }

    /**
     * Cleans up previous AI review files to ensure a fresh start
     * Only cleans specific folders when new files are being generated
     */
    private async cleanupPreviousFiles(): Promise<void> {
        try {
            const fileCount = CleanupManager.getFileCount();
            if (fileCount.total > 0) {
                // Only clean prompts, changes, and results folders when generating new files
                await CleanupManager.cleanupSelectiveDirectories(['prompts', 'changes', 'results']);
                console.log(`Cleaned up ${fileCount.total} files from previous AI review sessions`);
            }
        } catch (error) {
            console.warn('Failed to cleanup previous files:', error);
            // Don't throw error - cleanup failure shouldn't prevent new review
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
            // Get workspace folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found.');
                return null;
            }

            // Ensure .ai-code-review/results folder exists
            const resultsFolder = vscode.Uri.joinPath(workspaceFolder.uri, '.ai-code-review', 'results');
            
            try {
                const folderStat = await vscode.workspace.fs.stat(resultsFolder);
                if (!(folderStat.type & vscode.FileType.Directory)) {
                    vscode.window.showErrorMessage('.ai-code-review/results is not a directory.');
                    return null;
                }
            } catch (error) {
                // Directory doesn't exist, create it
                try {
                    await vscode.workspace.fs.createDirectory(resultsFolder);
                } catch (createError) {
                    vscode.window.showErrorMessage('Failed to create .ai-code-review/results directory.');
                    return null;
                }
            }

            // Read directory contents
            const files = await vscode.workspace.fs.readDirectory(resultsFolder);
            const jsonFiles = files.filter(([name, type]) => 
                type === vscode.FileType.File && name.endsWith('.json')
            ).sort((a, b) => b[0].localeCompare(a[0])); // Sort by name descending to get the latest

            if (jsonFiles.length === 0) {
                vscode.window.showErrorMessage('No JSON result files found in .ai-code-review/results folder.');
                return null;
            }

            // Read the first (latest) JSON file
            const firstFile = jsonFiles[0][0];
            const fileUri = vscode.Uri.joinPath(resultsFolder, firstFile);
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
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
                    `Successfully loaded review result from ${firstFile} with ${result.issues.length} issues.`
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

    /**
     * Gets the path of the last generated prompt file
     */
    public async getLastPromptFilePath(): Promise<string | undefined> {
        return this.lastPromptFilePath;
    }

    /**
     * Gets the path of the last generated change file
     */
    public async getLastChangeFilePath(): Promise<string | undefined> {
        return this.lastChangeFilePath;
    }

    private async storeChangesToFile(changeInfo: ChangeInfo): Promise<string> {
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const aiReviewDir = path.join(workspacePath, '.ai-code-review');
        const changesDir = path.join(aiReviewDir, 'changes');
        
        // Create the .ai-code-review and changes directories if they don't exist
        if (!fs.existsSync(aiReviewDir)) {
            fs.mkdirSync(aiReviewDir, { recursive: true });
        }
        if (!fs.existsSync(changesDir)) {
            fs.mkdirSync(changesDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `ai-code-review-changes-${timestamp}.json`;
        const filePath = path.join(changesDir, fileName);
        
        const content = JSON.stringify(changeInfo, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
        
        return filePath;
    }
}