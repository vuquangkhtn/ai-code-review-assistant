import * as vscode from 'vscode';
import { ComparisonGroup } from '../types';

export class ComparisonTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
    private readonly changed = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this.changed.event;
    private roots: vscode.TreeItem[] = [];
    private children = new Map<vscode.TreeItem, vscode.TreeItem[]>();

    update(groups: ComparisonGroup[]): void {
        this.children.clear();
        this.roots = groups.map(group => {
            const location = new vscode.TreeItem(`${group.filePath}:${group.lineNumber}`, vscode.TreeItemCollapsibleState.Expanded);
            this.children.set(location, group.findings.map(finding => {
                const shared = finding.entries.length > 1;
                const item = new vscode.TreeItem(`${shared ? 'Shared' : 'Unique'}: ${finding.entries[0].issue.title}`,
                    vscode.TreeItemCollapsibleState.Expanded);
                item.description = finding.entries.map(entry => entry.provider).join(' + ');
                item.iconPath = new vscode.ThemeIcon(shared ? 'link' : 'circle-outline');
                this.children.set(item, finding.entries.map(({ provider, issue }) => {
                    const detail = new vscode.TreeItem(`${provider}: ${issue.severity}`);
                    detail.description = issue.confidence ? `Confidence: ${issue.confidence}` : undefined;
                    detail.tooltip = [issue.description, ...issue.suggestions.map(s => s.description),
                        issue.evidence ? `Evidence: ${issue.evidence}` : ''].filter(Boolean).join('\n\n');
                    return detail;
                }));
                return item;
            }));
            return location;
        });
        if (!this.roots.length) { this.roots = [new vscode.TreeItem('No findings from either provider')]; }
        this.changed.fire();
    }
    getTreeItem(item: vscode.TreeItem): vscode.TreeItem { return item; }
    getChildren(item?: vscode.TreeItem): vscode.TreeItem[] { return item ? this.children.get(item) || [] : this.roots; }
    dispose(): void { this.changed.dispose(); }
}
