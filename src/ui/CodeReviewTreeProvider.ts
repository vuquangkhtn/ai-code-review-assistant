import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class CodeReviewTreeProvider implements vscode.TreeDataProvider<CodeReviewItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CodeReviewItem | undefined | null | void> = new vscode.EventEmitter<CodeReviewItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CodeReviewItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    private currentDefaultChangeType: string = 'local';

    constructor() {
        // Load the default change type from configuration
        this.loadDefaultChangeType();
    }

    private hasResultFiles(): boolean {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return false;
        }
        
        const resultsPath = path.join(workspaceFolder.uri.fsPath, '.ai-code-review', 'results');
        
        try {
            if (!fs.existsSync(resultsPath)) {
                return false;
            }
            
            const files = fs.readdirSync(resultsPath);
            return files.length > 0;
        } catch (error) {
            return false;
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    private loadDefaultChangeType(): void {
        const config = vscode.workspace.getConfiguration('aiCodeReview');
        this.currentDefaultChangeType = config.get<string>('defaultChangeType', 'local');
    }

    public updateDefaultChangeType(changeType: string): void {
        this.currentDefaultChangeType = changeType;
        this.refresh();
    }

    getTreeItem(element: CodeReviewItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CodeReviewItem): Promise<CodeReviewItem[]> {
        if (!element) {
            // Root level items
            return Promise.resolve([
                new CodeReviewItem(
                    'Open Workflow Guide',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.openWorkflowGuide',
                        title: 'Open Workflow Guide',
                        arguments: []
                    },
                    'action',
                    'book',
                    'Open detailed workflow guide in a new panel'
                ),
                new CodeReviewItem(
                    'Configure Change Type',
                    vscode.TreeItemCollapsibleState.Expanded,
                    undefined,
                    'defaultChangeTypeGroup',
                    'gear'
                ),
                new CodeReviewItem(
                    'Generate AI Prompt',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.copyPrompt',
                        title: 'Copy Prompt',
                        arguments: []
                    },
                    'action',
                    'copy'
                ),
                new CodeReviewItem(
                    'Paste Prompt to AI Chat',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.pastePrompt',
                        title: 'Paste Prompt to AI Chat',
                        arguments: []
                    },
                    'action',
                    'send'
                ),
                new CodeReviewItem(
                    'Generate Code Review Result',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.checkReviewResult',
                        title: 'Generate Code Review Result',
                        arguments: []
                    },
                    'action',
                    'check',
                    'Generate Code Review results'
                ),
                new CodeReviewItem(
                    'View Code Review Report',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.openPanel',
                        title: 'Open Panel',
                        arguments: []
                    },
                    'action',
                    'eye'
                ),
            ]);
        } else if (element.contextValue === 'defaultChangeTypeGroup') {
            // Default Change Type options
            return Promise.resolve([
                new CodeReviewItem(
                    'Local Changes',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.setDefaultChangeType',
                        title: 'Set Default to Local Changes',
                        arguments: ['local']
                    },
                    'changeTypeOption',
                    this.currentDefaultChangeType === 'local' ? 'check' : 'circle-outline',
                    this.currentDefaultChangeType === 'local' ? 'Currently selected' : 'Click to set as default'
                ),
                new CodeReviewItem(
                    'All Files',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.setDefaultChangeType',
                        title: 'Set Default to All Files',
                        arguments: ['all-files']
                    },
                    'changeTypeOption',
                    this.currentDefaultChangeType === 'all-files' ? 'check' : 'circle-outline',
                    this.currentDefaultChangeType === 'all-files' ? 'Currently selected' : 'Click to set as default'
                ),
                new CodeReviewItem(
                    'Compare Branches',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.setDefaultChangeType',
                        title: 'Set Default to Compare Branches',
                        arguments: ['branch']
                    },
                    'changeTypeOption',
                    this.currentDefaultChangeType === 'branch' ? 'check' : 'circle-outline',
                    this.currentDefaultChangeType === 'branch' ? 'Currently selected' : 'Click to set as default'
                )
            ]);
        }
        return Promise.resolve([]);
    }
}

export class CodeReviewItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly contextValue?: string,
        public readonly iconName?: string,
        public readonly tooltipText?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltipText || this.label;
        this.contextValue = contextValue || 'codeReviewItem';
        
        if (iconName) {
            this.iconPath = new vscode.ThemeIcon(iconName);
        }
    }
}