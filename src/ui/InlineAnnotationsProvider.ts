import * as vscode from 'vscode';
import { CodeIssue, IssueSeverity } from '../types';

export class InlineAnnotationsProvider {
    private _decorationTypes: Map<IssueSeverity, vscode.TextEditorDecorationType> = new Map();
    private _resolvedDecorationType!: vscode.TextEditorDecorationType;
    private _issues: CodeIssue[] = [];
    private _diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this._diagnosticCollection = vscode.languages.createDiagnosticCollection('aiCodeReview');
        this._initializeDecorationTypes();
        this._initializeResolvedDecorationType();
        
        // Listen for active editor changes to update decorations
        vscode.window.onDidChangeActiveTextEditor(() => {
            this._updateDecorations();
        });
    }

    private _initializeDecorationTypes() {
        this._decorationTypes.set(IssueSeverity.CRITICAL, vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid #ff4444',
            borderWidth: '0 0 0 3px',
            overviewRulerColor: '#ff4444',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            before: {
                color: '#ff4444',
                fontWeight: 'bold'
            }
        }));

        this._decorationTypes.set(IssueSeverity.HIGH, vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 136, 0, 0.1)',
            border: '1px solid #ff8800',
            borderWidth: '0 0 0 3px',
            overviewRulerColor: '#ff8800',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            before: {
                color: '#ff8800',
                fontWeight: 'bold'
            }
        }));

        this._decorationTypes.set(IssueSeverity.MEDIUM, vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 204, 0, 0.1)',
            border: '1px solid #ffcc00',
            borderWidth: '0 0 0 3px',
            overviewRulerColor: '#ffcc00',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            before: {
                color: '#ffcc00'
            }
        }));

        this._decorationTypes.set(IssueSeverity.LOW, vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 170, 0, 0.1)',
            border: '1px solid #00aa00',
            borderWidth: '0 0 0 3px',
            overviewRulerColor: '#00aa00',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            before: {
                color: '#00aa00'
            }
        }));
    }

    private _initializeResolvedDecorationType() {
        this._resolvedDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(128, 128, 128, 0.1)',
            border: '1px solid #808080',
            borderWidth: '0 0 0 3px',
            opacity: '0.6',
            after: {
                color: '#808080'
            }
        });
    }

    public markIssueAsResolved(issueId: string) {
        const issue = this._issues.find(i => i.id === issueId);
        if (issue) {
            issue.resolved = true;
            this._updateDecorations();
            this._updateDiagnostics();
        }
    }

    public markIssueAsUnresolved(issueId: string) {
        const issue = this._issues.find(i => i.id === issueId);
        if (issue) {
            issue.resolved = false;
            this._updateDecorations();
            this._updateDiagnostics();
        }
    }

    public updateIssues(issues: CodeIssue[]) {
        this._issues = issues;
        this._updateDecorations();
        this._updateDiagnostics();
    }

    public clearIssues() {
        this._issues = [];
        this._clearDecorations();
        this._diagnosticCollection.clear();
    }

    private _updateDecorations() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        // Clear existing decorations
        this._decorationTypes.forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });
        editor.setDecorations(this._resolvedDecorationType, []);

        // Group issues by severity for the current file
        const currentFileIssues = this._issues.filter(issue => 
            issue.filePath === editor.document.uri.fsPath ||
            issue.filePath === editor.document.uri.path ||
            issue.filePath.endsWith(editor.document.uri.fsPath.split('/').pop() || '')
        );

        // Separate resolved and unresolved issues
        const unresolvedIssues = currentFileIssues.filter(issue => !issue.resolved);
        const resolvedIssues = currentFileIssues.filter(issue => issue.resolved);

        const issuesBySeverity = new Map<IssueSeverity, CodeIssue[]>();
        unresolvedIssues.forEach(issue => {
            if (!issuesBySeverity.has(issue.severity)) {
                issuesBySeverity.set(issue.severity, []);
            }
            issuesBySeverity.get(issue.severity)!.push(issue);
        });

        // Apply decorations for each severity
        issuesBySeverity.forEach((issues, severity) => {
            const decorationType = this._decorationTypes.get(severity);
            if (!decorationType) return;

            const decorations: vscode.DecorationOptions[] = issues.map(issue => {
                // Convert from 1-based line number to 0-based for VS Code
                const issueLine = Math.max(0, issue.lineNumber - 1);
                const range = new vscode.Range(
                    issueLine,
                    0,
                    issueLine,
                    editor.document.lineAt(issueLine).text.length
                );

                return {
                    range,
                    hoverMessage: new vscode.MarkdownString(
                        `**${issue.title}** (${issue.severity} | [Mark as Resolved](command:aiCodeReview.markIssueResolved?${encodeURIComponent(JSON.stringify([issue.id]))}))\n\n${issue.description}\n\n` +
                        (issue.suggestions.length > 0 ? 
                            `**Suggestions:**\n${issue.suggestions.map(s => `• ${s.description}`).join('\n')}` : '')
                    )
                };
            });

            editor.setDecorations(decorationType, decorations);
        });

        // Apply decorations for resolved issues
        if (resolvedIssues.length > 0) {
            const resolvedDecorations: vscode.DecorationOptions[] = resolvedIssues.map(issue => {
                // Convert from 1-based line number to 0-based for VS Code
                const issueLine = Math.max(0, issue.lineNumber - 1);
                const range = new vscode.Range(
                    issueLine,
                    0,
                    issueLine,
                    editor.document.lineAt(issueLine).text.length
                );

                return {
                    range,
                    hoverMessage: new vscode.MarkdownString(
                        `**${issue.title}** (${issue.severity} | [Mark as Unresolved](command:aiCodeReview.markIssueUnresolved?${encodeURIComponent(JSON.stringify([issue.id]))})) - RESOLVED\n\n${issue.description}\n\n` +
                        (issue.suggestions.length > 0 ? 
                            `**Suggestions:**\n${issue.suggestions.map(s => `• ${s.description}`).join('\n')}` : '')
                    )
                };
            });

            editor.setDecorations(this._resolvedDecorationType, resolvedDecorations);
        }
    }

    private _updateDiagnostics() {
        const diagnosticMap = new Map<string, vscode.Diagnostic[]>();

        // Only show diagnostics for unresolved issues
        const unresolvedIssues = this._issues.filter(issue => !issue.resolved);
        unresolvedIssues.forEach(issue => {
            // Ensure file path is absolute
            let absolutePath = issue.filePath;
            if (!absolutePath.startsWith('/') && !absolutePath.match(/^[a-zA-Z]:/)) {
                // Relative path - join with workspace root
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    absolutePath = vscode.Uri.joinPath(workspaceFolder.uri, issue.filePath).fsPath;
                }
            }
            
            const uri = vscode.Uri.file(absolutePath);
            const uriString = uri.toString();

            if (!diagnosticMap.has(uriString)) {
                diagnosticMap.set(uriString, []);
            }

            // Convert from 1-based line number to 0-based for VS Code
            const line = Math.max(0, issue.lineNumber - 1);
            const range = new vscode.Range(
                line,
                issue.columnNumber || 0,
                line,
                issue.columnNumber ? issue.columnNumber + 10 : 100 // Approximate end position
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                `${issue.title}: ${issue.description}`,
                this._getSeverityLevel(issue.severity)
            );

            diagnostic.source = 'AI Code Review';
            diagnostic.code = issue.id;

            diagnosticMap.get(uriString)!.push(diagnostic);
        });

        // Clear existing diagnostics
        this._diagnosticCollection.clear();

        // Set new diagnostics
        diagnosticMap.forEach((diagnostics, uriString) => {
            this._diagnosticCollection.set(vscode.Uri.parse(uriString), diagnostics);
        });
    }

    private _getSeverityLevel(severity: IssueSeverity): vscode.DiagnosticSeverity {
        switch (severity) {
            case IssueSeverity.CRITICAL:
                return vscode.DiagnosticSeverity.Error;
            case IssueSeverity.HIGH:
                return vscode.DiagnosticSeverity.Error;
            case IssueSeverity.MEDIUM:
                return vscode.DiagnosticSeverity.Warning;
            case IssueSeverity.LOW:
                return vscode.DiagnosticSeverity.Information;
            default:
                return vscode.DiagnosticSeverity.Information;
        }
    }

    private _clearDecorations() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        this._decorationTypes.forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });
        editor.setDecorations(this._resolvedDecorationType, []);
    }

    public dispose() {
        this._decorationTypes.forEach(decorationType => {
            decorationType.dispose();
        });
        this._resolvedDecorationType.dispose();
        this._diagnosticCollection.dispose();
    }
}