import * as vscode from 'vscode';
import { CodeIssue, IssueSeverity, IssueCategory } from '../types';

export class IssuesPanelProvider implements vscode.TreeDataProvider<IssueItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<IssueItem | undefined | null | void> = new vscode.EventEmitter<IssueItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<IssueItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private issues: CodeIssue[] = [];
    private groupBy: 'severity' | 'category' | 'file' = 'severity';

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateIssues(issues: CodeIssue[]): void {
        this.issues = issues;
        this.refresh();
    }

    setGroupBy(groupBy: 'severity' | 'category' | 'file'): void {
        this.groupBy = groupBy;
        this.refresh();
    }

    getTreeItem(element: IssueItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: IssueItem): Promise<IssueItem[]> {
        if (!element) {
            // Root level - show groups
            if (this.issues.length === 0) {
                return Promise.resolve([
                    new IssueItem(
                        'No issues found',
                        'info',
                        vscode.TreeItemCollapsibleState.None,
                        undefined,
                        'Run a code review to see issues here'
                    )
                ]);
            }

            return Promise.resolve(this.getGroupedItems());
        } else if (element.contextValue === 'issueGroup') {
            // Show issues in this group
            return Promise.resolve(this.getIssuesForGroup(element));
        }

        return Promise.resolve([]);
    }

    private getGroupedItems(): IssueItem[] {
        const groups = new Map<string, CodeIssue[]>();

        // Group issues
        this.issues.forEach(issue => {
            let groupKey: string;
            switch (this.groupBy) {
                case 'severity':
                    groupKey = issue.severity;
                    break;
                case 'category':
                    groupKey = issue.category;
                    break;
                case 'file':
                    groupKey = this.getFileName(issue.filePath);
                    break;
                default:
                    groupKey = issue.severity;
            }

            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey)!.push(issue);
        });

        // Create group items
        const groupItems: IssueItem[] = [];
        groups.forEach((issues, groupKey) => {
            const iconName = this.getGroupIcon(groupKey);
            const label = `${groupKey.charAt(0).toUpperCase() + groupKey.slice(1)} (${issues.length})`;
            const color = this.groupBy === 'severity' ? this.getSeverityColor(groupKey) : undefined;
            
            groupItems.push(new IssueItem(
                label,
                iconName,
                vscode.TreeItemCollapsibleState.Expanded,
                undefined,
                `${issues.length} issues in ${groupKey}`,
                'issueGroup',
                groupKey,
                undefined,
                color
            ));
        });

        // Sort groups by priority
        return this.sortGroups(groupItems);
    }

    private getIssuesForGroup(groupItem: IssueItem): IssueItem[] {
        const groupKey = groupItem.groupKey!;
        let filteredIssues: CodeIssue[];

        switch (this.groupBy) {
            case 'severity':
                filteredIssues = this.issues.filter(issue => issue.severity === groupKey);
                break;
            case 'category':
                filteredIssues = this.issues.filter(issue => issue.category === groupKey);
                break;
            case 'file':
                filteredIssues = this.issues.filter(issue => this.getFileName(issue.filePath) === groupKey);
                break;
            default:
                filteredIssues = [];
        }

        return filteredIssues.map(issue => {
            const iconName = issue.resolved ? 'check' : this.getSeverityIcon(issue.severity);
            const label = issue.resolved ? `✓ ${issue.title}` : issue.title;
            const description = `${this.getFileName(issue.filePath)}:${issue.lineNumber}${issue.resolved ? ' (Resolved)' : ''}`;
            const color = issue.resolved ? new vscode.ThemeColor('charts.green') : this.getSeverityColor(issue.severity);
            
            // Create URI for the file
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            let fileUri: vscode.Uri;
            if (workspaceFolder && !issue.filePath.startsWith('/') && !issue.filePath.match(/^[a-zA-Z]:/)) {
                // Relative path - join with workspace root
                fileUri = vscode.Uri.joinPath(workspaceFolder.uri, issue.filePath);
            } else {
                // Absolute path
                fileUri = vscode.Uri.file(issue.filePath);
            }
            
            return new IssueItem(
                label,
                iconName,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [
                        fileUri,
                        {
                            selection: new vscode.Range(
                                Math.max(0, issue.lineNumber - 1),
                                issue.columnNumber || 0,
                                Math.max(0, issue.lineNumber - 1),
                                issue.columnNumber || 0
                            )
                        }
                    ]
                },
                `${issue.severity} - ${issue.description}`,
                issue.resolved ? 'resolvedIssue' : 'unresolvedIssue',
                undefined,
                description,
                color,
                issue.id
            );
        });
    }

    private getFileName(filePath: string): string {
        return filePath.split('/').pop() || filePath;
    }

    private getGroupIcon(groupKey: string): string {
        switch (this.groupBy) {
            case 'severity':
                return this.getSeverityIcon(groupKey as IssueSeverity);
            case 'category':
                return this.getCategoryIcon(groupKey as IssueCategory);
            case 'file':
                return 'file';
            default:
                return 'folder';
        }
    }

    private getSeverityIcon(severity: IssueSeverity | string): string {
        switch (severity) {
            case IssueSeverity.CRITICAL:
                return 'error';
            case IssueSeverity.HIGH:
                return 'warning';
            case IssueSeverity.MEDIUM:
                return 'info';
            case IssueSeverity.LOW:
                return 'check';
            default:
                return 'circle-outline';
        }
    }

    private getSeverityColor(severity: IssueSeverity | string): vscode.ThemeColor | undefined {
        switch (severity) {
            case IssueSeverity.CRITICAL:
                return new vscode.ThemeColor('charts.purple');
            case IssueSeverity.HIGH:
                return new vscode.ThemeColor('errorForeground');
            case IssueSeverity.MEDIUM:
                return new vscode.ThemeColor('problemsWarningIcon.foreground');
            case IssueSeverity.LOW:
                return new vscode.ThemeColor('charts.blue');
            default:
                return undefined;
        }
    }

    private getCategoryIcon(category: IssueCategory | string): string {
        switch (category) {
            case IssueCategory.SECURITY:
                return 'shield';
            case IssueCategory.PERFORMANCE:
                return 'zap';
            case IssueCategory.CODE_QUALITY:
                return 'code';
            case IssueCategory.BEST_PRACTICES:
                return 'thumbsup';
            case IssueCategory.STYLE:
                return 'paintcan';
            case IssueCategory.MAINTAINABILITY:
                return 'tools';
            case IssueCategory.TESTING:
                return 'beaker';
            case IssueCategory.DOCUMENTATION:
                return 'book';
            default:
                return 'question';
        }
    }

    private sortGroups(groups: IssueItem[]): IssueItem[] {
        if (this.groupBy === 'severity') {
            const severityOrder = [IssueSeverity.CRITICAL, IssueSeverity.HIGH, IssueSeverity.MEDIUM, IssueSeverity.LOW];
            return groups.sort((a, b) => {
                const aIndex = severityOrder.findIndex(s => a.groupKey === s);
                const bIndex = severityOrder.findIndex(s => b.groupKey === s);
                return aIndex - bIndex;
            });
        }
        return groups.sort((a, b) => a.label.localeCompare(b.label));
    }
}

export class IssueItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly iconName: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly tooltip?: string,
        public readonly contextValue?: string,
        public readonly groupKey?: string,
        public readonly description?: string,
        public readonly iconColor?: vscode.ThemeColor,
        public readonly issueId?: string
    ) {
        super(label, collapsibleState);
        
        this.tooltip = tooltip || this.label;
        this.description = description;
        this.contextValue = contextValue || 'issueItem';
        
        // Set icon with color
        this.iconPath = new vscode.ThemeIcon(iconName, iconColor);
    }
}