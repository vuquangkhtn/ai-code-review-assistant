import * as vscode from 'vscode';
import { CodeReviewManager } from '../core/CodeReviewManager';
import { CodeIssue, IssueSeverity } from '../types';

export class InlineAnnotationsProvider implements vscode.CodeLensProvider {
    private codeReviewManager: CodeReviewManager;
    private decorationTypes: Map<IssueSeverity, vscode.TextEditorDecorationType> = new Map();
    private activeDecorations: Map<string, vscode.TextEditorDecorationType[]> = new Map();

    constructor(codeReviewManager: CodeReviewManager) {
        this.codeReviewManager = codeReviewManager;
        this.initializeDecorationTypes();
    }

    private initializeDecorationTypes(): void {
        // Create decoration types for different severity levels
        this.decorationTypes.set(IssueSeverity.CRITICAL, vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('errorForeground'),
            border: '2px solid',
            borderColor: new vscode.ThemeColor('errorForeground'),
            overviewRulerColor: new vscode.ThemeColor('errorForeground'),
            overviewRulerLane: vscode.OverviewRulerLane.Right
        }));

        this.decorationTypes.set(IssueSeverity.HIGH, vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('warningForeground'),
            border: '1px solid',
            borderColor: new vscode.ThemeColor('warningForeground'),
            overviewRulerColor: new vscode.ThemeColor('warningForeground'),
            overviewRulerLane: vscode.OverviewRulerLane.Right
        }));

        this.decorationTypes.set(IssueSeverity.MEDIUM, vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('textPreformat.foreground'),
            border: '1px solid',
            borderColor: new vscode.ThemeColor('textPreformat.foreground'),
            overviewRulerColor: new vscode.ThemeColor('textPreformat.foreground'),
            overviewRulerLane: vscode.OverviewRulerLane.Right
        }));

        this.decorationTypes.set(IssueSeverity.LOW, vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('textPreformat.background'),
            border: '1px solid',
            borderColor: new vscode.ThemeColor('textPreformat.background'),
            overviewRulerColor: new vscode.ThemeColor('textPreformat.background'),
            overviewRulerLane: vscode.OverviewRulerLane.Right
        }));
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        const results = this.codeReviewManager.getReviewResults();
        
        // Get all issues for this document
        const documentIssues: CodeIssue[] = [];
        results.forEach(result => {
            result.issues.forEach(issue => {
                if (issue.filePath === document.fileName) {
                    documentIssues.push(issue);
                }
            });
        });

        // Create code lenses for each issue
        documentIssues.forEach(issue => {
            const range = new vscode.Range(
                issue.lineNumber - 1,
                issue.columnNumber || 0,
                issue.lineNumber - 1,
                issue.columnNumber || 0
            );

            const codeLens = new vscode.CodeLens(range, {
                title: `${issue.severity.toUpperCase()}: ${issue.title}`,
                command: 'aiCodeReview.showIssueDetails',
                arguments: [issue]
            });

            codeLenses.push(codeLens);
        });

        return codeLenses;
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.CodeLens {
        return codeLens;
    }

    public updateDecorations(editor: vscode.TextEditor): void {
        const document = editor.document;
        const results = this.codeReviewManager.getReviewResults();
        
        // Clear existing decorations
        this.clearDecorations(editor);
        
        // Get all issues for this document
        const documentIssues: CodeIssue[] = [];
        results.forEach(result => {
            result.issues.forEach(issue => {
                if (issue.filePath === document.fileName) {
                    documentIssues.push(issue);
                }
            });
        });

        // Apply decorations for each issue
        documentIssues.forEach(issue => {
            const decorationType = this.decorationTypes.get(issue.severity);
            if (decorationType) {
                const range = new vscode.Range(
                    issue.lineNumber - 1,
                    issue.columnNumber || 0,
                    issue.lineNumber - 1,
                    issue.columnNumber || 0
                );

                editor.setDecorations(decorationType, [range]);
                
                // Track decorations for this editor
                if (!this.activeDecorations.has(editor.document.uri.toString())) {
                    this.activeDecorations.set(editor.document.uri.toString(), []);
                }
                this.activeDecorations.get(editor.document.uri.toString())!.push(decorationType);
            }
        });
    }

    public clearDecorations(editor: vscode.TextEditor): void {
        const uri = editor.document.uri.toString();
        const decorations = this.activeDecorations.get(uri);
        
        if (decorations) {
            decorations.forEach(decorationType => {
                editor.setDecorations(decorationType, []);
            });
            this.activeDecorations.delete(uri);
        }
    }

    public clearAllDecorations(): void {
        this.activeDecorations.forEach((decorations, uri) => {
            const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uri);
            if (editor) {
                decorations.forEach(decorationType => {
                    editor.setDecorations(decorationType, []);
                });
            }
        });
        this.activeDecorations.clear();
    }

    public showIssueHover(issue: CodeIssue, position: vscode.Position): void {
        const hover = new vscode.Hover([
            `**${issue.severity.toUpperCase()} - ${issue.category}**`,
            issue.description,
            '',
            '**Suggestions:**',
            ...issue.suggestions.map(s => `• ${s.description}`)
        ]);

        // This would require additional implementation to show hover at position
        // For now, we'll show it in the status bar
        vscode.window.showInformationMessage(
            `${issue.severity.toUpperCase()}: ${issue.description}`
        );
    }

    public getIssuesForLine(document: vscode.TextDocument, line: number): CodeIssue[] {
        const results = this.codeReviewManager.getReviewResults();
        const issues: CodeIssue[] = [];
        
        results.forEach(result => {
            result.issues.forEach(issue => {
                if (issue.filePath === document.fileName && issue.lineNumber === line + 1) {
                    issues.push(issue);
                }
            });
        });

        return issues;
    }

    public dispose(): void {
        // Clean up decoration types
        this.decorationTypes.forEach(decorationType => {
            decorationType.dispose();
        });
        this.decorationTypes.clear();
        
        // Clear all decorations
        this.clearAllDecorations();
        this.activeDecorations.clear();
    }
}
