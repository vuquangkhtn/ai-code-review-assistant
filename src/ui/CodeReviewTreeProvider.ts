import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CLIReviewStatus } from '../types';

/** Presentation of the one-button CLI Review row, derived only from the run status. */
export function cliReviewRowSpec(status: CLIReviewStatus): {
    label: string; description: string; icon: string;
    commandId: string; commandTitle: string; contextValue: string; tooltip: string;
} {
    if (status.kind === 'running') {
        const progress = status.progress ? `${status.progress.reviewed}/${status.progress.total} files` : 'Running…';
        return { label: 'CLI Review', description: progress, icon: 'loading~spin',
            commandId: 'aiCodeReview.cancelCLIReview', commandTitle: 'Stop the running review?',
            contextValue: 'cliReviewRunning', tooltip: 'Click to stop the running review (asks for confirmation)' };
    }
    if (status.kind === 'failed') {
        return { label: 'CLI Review', description: status.message, icon: 'error',
            commandId: 'aiCodeReview.runCLIReview', commandTitle: 'Run CLI Review',
            contextValue: 'cliReviewAction', tooltip: status.message };
    }
    if (status.kind === 'done') {
        return { label: 'CLI Review', description: 'Review completed', icon: 'check',
            commandId: 'aiCodeReview.runCLIReview', commandTitle: 'Run CLI Review',
            contextValue: 'cliReviewAction', tooltip: 'Run a CLI review' };
    }
    return { label: 'CLI Review', description: '', icon: 'play',
        commandId: 'aiCodeReview.runCLIReview', commandTitle: 'Run CLI Review',
        contextValue: 'cliReviewAction', tooltip: 'Run a CLI review' };
}

export class CodeReviewTreeProvider implements vscode.TreeDataProvider<CodeReviewItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CodeReviewItem | undefined | null | void> = new vscode.EventEmitter<CodeReviewItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CodeReviewItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    private cliStatus: CLIReviewStatus = { kind: 'idle' };

    setCLIStatus(status: CLIReviewStatus): void {
        this.cliStatus = status;
        this.refresh();
    }

    /** Current row status so commands can heal a stale `running` render (issue #38). */
    getCLIStatus(): CLIReviewStatus {
        return this.cliStatus;
    }

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
            // Root level items: one-button CLI Review row, then Manual Review, then the Review Type group.
            const cli = cliReviewRowSpec(this.cliStatus);
            return Promise.resolve([
                new CodeReviewItem(
                    cli.label,
                    vscode.TreeItemCollapsibleState.None,
                    { command: cli.commandId, title: cli.commandTitle },
                    cli.contextValue,
                    cli.icon,
                    cli.tooltip,
                    cli.description || undefined
                ),
                new CodeReviewItem(
                    'Manual Review',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'aiCodeReview.copyPrompt',
                        title: 'Manual Review',
                        arguments: []
                    },
                    'action',
                    'copy',
                    'Generate a prompt to paste into any AI chat'
                ),
                new CodeReviewItem(
                    'Review Type',
                    vscode.TreeItemCollapsibleState.Expanded,
                    undefined,
                    'defaultChangeTypeGroup',
                    'gear',
                    'Choose which changes to review'
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
        public readonly tooltipText?: string,
        public readonly descriptionText?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltipText || this.label;
        this.contextValue = contextValue || 'codeReviewItem';

        if (iconName) {
            this.iconPath = new vscode.ThemeIcon(iconName);
        }
        if (descriptionText) {
            this.description = descriptionText;
        }
    }
}