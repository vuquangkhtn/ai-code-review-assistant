import * as vscode from 'vscode';

export class CodeReviewTreeProvider implements vscode.TreeDataProvider<CodeReviewItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CodeReviewItem | undefined | null | void> = new vscode.EventEmitter<CodeReviewItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CodeReviewItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: CodeReviewItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CodeReviewItem): Promise<CodeReviewItem[]> {
        if (!element) {
            // Root level items
            return Promise.resolve([
                new CodeReviewItem(
                    'Open Code Review Panel',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.openPanel',
                        title: 'Open Panel',
                        arguments: []
                    }
                ),
                new CodeReviewItem(
                    'Copy Prompt for External AI',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.copyPrompt',
                        title: 'Copy Prompt',
                        arguments: []
                    }
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
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        this.contextValue = 'codeReviewItem';
    }
}