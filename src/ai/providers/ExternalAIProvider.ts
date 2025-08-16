import { ReviewRequest, ReviewResult } from '../../types';
import { AbstractAIProvider } from './BaseAIProvider';
import { PromptGenerator } from '../PromptGenerator';
import { ResponseParser } from '../ResponseParser';
import * as vscode from 'vscode';

export class ExternalAIProvider extends AbstractAIProvider {
    public readonly id = 'external-ai';
    public readonly name = 'External AI Provider';
    public readonly isAvailable = true;

    public async performReview(request: ReviewRequest): Promise<ReviewResult> {
        try {
            // Generate prompt for external AI
            const prompt = PromptGenerator.generatePrompt(request);
            
            // Copy prompt to clipboard
            await vscode.env.clipboard.writeText(prompt);
            
            // Show prompt to user and ask for response
            const response = await this.getExternalResponse(prompt);
            
            if (!response) {
                throw new Error('No response provided from external AI');
            }
            
            // Parse the external AI response
            const result = ResponseParser.parseResponse(response, request.aiProvider, request.changeInfo.files.map(f => f.path));
            
            if (!result) {
                throw new Error('Failed to parse AI response. Please check the response format.');
            }
            
            return result;
        } catch (error) {
            throw new Error(`External AI review failed: ${error}`);
        }
    }

    public async testConnection(): Promise<boolean> {
        // External AI is always "available" since it's manual
        return true;
    }

    public getCapabilities(): any {
        return {
            supportsCodeReview: true,
            supportsInlineSuggestions: false,
            maxContextLength: 100000, // No real limit for external AI
            supportedLanguages: ['*'], // Supports all languages
            requiresManualInput: true
        };
    }

    private async getExternalResponse(prompt: string): Promise<string | undefined> {
        // Show the prompt in a webview and ask user to paste response
        const panel = vscode.window.createWebviewPanel(
            'externalAIPrompt',
            'External AI Prompt',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getWebviewContent(prompt);

        return new Promise<string | undefined>((resolve) => {
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'submitResponse':
                            resolve(message.response);
                            panel.dispose();
                            break;
                        case 'cancel':
                            resolve(undefined);
                            panel.dispose();
                            break;
                        case 'copyPrompt':
                            vscode.env.clipboard.writeText(prompt);
                            vscode.window.showInformationMessage('Prompt copied to clipboard!');
                            break;
                    }
                },
                undefined
            );

            panel.onDidDispose(() => {
                resolve(undefined);
            });
        });
    }

    private getWebviewContent(prompt: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>External AI Prompt</title>
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
        .prompt-section {
            margin-bottom: 20px;
        }
        .prompt-text {
            background-color: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
        .response-section {
            margin-top: 20px;
        }
        .response-textarea {
            width: 100%;
            min-height: 200px;
            padding: 10px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            resize: vertical;
        }
        .button-group {
            margin-top: 15px;
            display: flex;
            gap: 10px;
        }
        .button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .button-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .button-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .button:hover {
            opacity: 0.9;
        }
        .instructions {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            padding: 10px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>External AI Code Review</h1>
        
        <div class="instructions">
            <h3>Instructions:</h3>
            <ol>
                <li>Copy the prompt below and paste it into your preferred AI provider (ChatGPT, Claude, etc.)</li>
                <li>Get the AI's response</li>
                <li>Paste the complete response in the text area below</li>
                <li>Click "Submit Response" to process the review</li>
            </ol>
        </div>

        <div class="prompt-section">
            <h3>Prompt for AI Provider:</h3>
            <div class="prompt-text">${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <button class="button button-secondary" onclick="copyPrompt()">Copy Prompt</button>
        </div>

        <div class="response-section">
            <h3>AI Response:</h3>
            <textarea id="responseText" class="response-textarea" placeholder="Paste the AI's response here..."></textarea>
            
            <div class="button-group">
                <button class="button button-primary" onclick="submitResponse()">Submit Response</button>
                <button class="button button-secondary" onclick="cancel()">Cancel</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function copyPrompt() {
            vscode.postMessage({
                command: 'copyPrompt'
            });
        }

        function submitResponse() {
            const responseText = document.getElementById('responseText').value.trim();
            if (!responseText) {
                alert('Please paste the AI response before submitting.');
                return;
            }
            
            vscode.postMessage({
                command: 'submitResponse',
                response: responseText
            });
        }

        function cancel() {
            vscode.postMessage({
                command: 'cancel'
            });
        }
    </script>
</body>
</html>`;
    }
}