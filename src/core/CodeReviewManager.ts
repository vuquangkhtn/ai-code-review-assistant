import * as vscode from 'vscode';
import { AIProviderManager } from '../ai/AIProviderManager';
import { ChangeDetector } from './ChangeDetector';
import { StorageManager } from './StorageManager';
import { 
    ReviewRequest, 
    ReviewResult, 
    ChangeInfo, 
    ReviewOptions, 
    ChangeType,
    IssueSeverity,
    UserPreferences 
} from '../types';

export class CodeReviewManager {
    private aiProviderManager: AIProviderManager;
    private changeDetector: ChangeDetector;
    private storageManager: StorageManager;
    private currentWorkspace?: vscode.WorkspaceFolder;
    private userPreferences: UserPreferences;
    private reviewResults: ReviewResult[] = [];

    constructor(
        aiProviderManager: AIProviderManager,
        changeDetector: ChangeDetector,
        storageManager: StorageManager
    ) {
        this.aiProviderManager = aiProviderManager;
        this.changeDetector = changeDetector;
        this.storageManager = storageManager;
        this.userPreferences = this.getDefaultPreferences();
        this.loadUserPreferences();
    }

    public async initializeWorkspace(workspace: vscode.WorkspaceFolder): Promise<void> {
        this.currentWorkspace = workspace;
        await this.changeDetector.initialize(workspace);
        await this.aiProviderManager.detectInstalledProviders();
    }

    public async startReview(): Promise<void> {
        const changeType = await this.showChangeTypeSelector();
        if (!changeType) return;

        switch (changeType) {
            case ChangeType.LOCAL:
                await this.reviewLocalChanges();
                break;
            case ChangeType.COMMIT:
                await this.reviewCommitChanges();
                break;
            case ChangeType.BRANCH:
                await this.reviewBranchChanges();
                break;
            case ChangeType.ALL_FILES:
                await this.reviewAllFiles();
                break;
        }
    }

    public async reviewLocalChanges(): Promise<void> {
        try {
            const changeInfo = await this.changeDetector.detectLocalChanges();
            if (!changeInfo.files.length) {
                vscode.window.showInformationMessage('No local changes detected.');
                return;
            }

            await this.performReview(changeInfo);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to review local changes: ${error}`);
        }
    }

    public async reviewCommitChanges(): Promise<void> {
        try {
            const commitHash = await this.showCommitSelector();
            if (!commitHash) return;

            const changeInfo = await this.changeDetector.detectCommitChanges(commitHash);
            await this.performReview(changeInfo);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to review commit changes: ${error}`);
        }
    }

    public async reviewBranchChanges(): Promise<void> {
        try {
            const branchSelection = await this.showBranchSelector();
            if (!branchSelection) return;

            const changeInfo = await this.changeDetector.detectBranchChanges(branchSelection.sourceBranch, branchSelection.targetBranch);
            await this.performReview(changeInfo);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to review branch changes: ${error}`);
        }
    }

    public async reviewAllFiles(): Promise<void> {
        try {
            const confirmation = await vscode.window.showWarningMessage(
                'This will review all files in the repository. This may take a while for large repositories. Continue?',
                'Yes', 'No'
            );
            
            if (confirmation !== 'Yes') {
                return;
            }

            const changeInfo = await this.changeDetector.getAllRepositoryFiles();
            if (!changeInfo.files.length) {
                vscode.window.showInformationMessage('No files found in repository.');
                return;
            }

            vscode.window.showInformationMessage(`Found ${changeInfo.files.length} files to review.`);
            await this.performReview(changeInfo);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to review all files: ${error}`);
        }
    }

    private async performReview(changeInfo: ChangeInfo): Promise<void> {
        const aiProvider = await this.selectAIProvider();
        if (!aiProvider) return;

        const reviewOptions = await this.getReviewOptions();
        const reviewRequest: ReviewRequest = {
            changeInfo,
            aiProvider,
            options: reviewOptions
        };

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'AI Code Review in Progress...',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Analyzing changes...' });
            
            try {
                const result = await this.aiProviderManager.performReview(reviewRequest);
                this.reviewResults.push(result);
                await this.storageManager.saveReviewResult(result);
                
                progress.report({ message: 'Review completed!' });
                this.showReviewResults(result);
            } catch (error) {
                vscode.window.showErrorMessage(`Review failed: ${error}`);
            }
        });
    }

    private async showChangeTypeSelector(): Promise<ChangeType | undefined> {
        const options = [
            { label: 'Local Changes', value: ChangeType.LOCAL },
            { label: 'Commit Changes', value: ChangeType.COMMIT },
            { label: 'Branch Changes', value: ChangeType.BRANCH },
            { label: 'All Files', value: ChangeType.ALL_FILES }
        ];

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select change type to review'
        });

        return selected?.value;
    }

    private async showCommitSelector(): Promise<string | undefined> {
        const commits = await this.changeDetector.getRecentCommits();
        const options = commits.map(commit => ({
            label: `${commit.hash.substring(0, 8)} - ${commit.message}`,
            value: commit.hash
        }));

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select commit to review'
        });

        return selected?.value;
    }

    private async showBranchSelector(): Promise<{ sourceBranch: string; targetBranch: string } | undefined> {
        const branches = await this.changeDetector.getBranches();
        const currentBranch = await this.changeDetector.getCurrentBranch();

        const sourceBranch = await vscode.window.showQuickPick(branches, {
            placeHolder: 'Select source branch'
        });

        if (!sourceBranch) return undefined;

        const targetBranch = await vscode.window.showQuickPick(branches, {
            placeHolder: 'Select target branch'
        });

        if (!targetBranch) return undefined;

        return { sourceBranch, targetBranch };
    }

    private async selectAIProvider(): Promise<string | undefined> {
        const allProviders = this.aiProviderManager.getAllProviders();
        if (allProviders.length === 0) {
            vscode.window.showErrorMessage('No AI providers available. Please install at least one supported extension.');
            return undefined;
        }

        const options = allProviders.map(provider => ({
            label: provider.name,
            description: provider.isInstalled ? '✅ Installed' : '❌ Not installed',
            detail: provider.isInstalled ? 'Ready to use' : 'Click to install',
            value: provider.id
        }));

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select AI provider for review (uninstalled providers will show installation options)'
        });

        if (!selected) return undefined;

        const provider = allProviders.find(p => p.id === selected.value);
        if (provider && !provider.isInstalled) {
            // Show installation guidance for uninstalled providers
            await this.showInstallationGuidance(provider.id);
            return undefined; // Don't proceed with uninstalled provider
        }

        return selected.value;
    }

    private async getReviewOptions(): Promise<ReviewOptions> {
        return {
            severityThreshold: this.userPreferences.severityThreshold,
            includeCodeExamples: true,
            includeSuggestions: true,
            maxIssuesPerFile: 50,
            focusCategories: undefined
        };
    }

    private showReviewResults(result: ReviewResult): void {
        const message = `Review completed! Found ${result.summary.totalIssues} issues.`;
        vscode.window.showInformationMessage(message, 'View Results').then(selection => {
            if (selection === 'View Results') {
                // Trigger the issues panel to show results
                vscode.commands.executeCommand('aiCodeReview.refreshIssues');
            }
        });
    }

    private getDefaultPreferences(): UserPreferences {
        return {
            defaultChangeType: ChangeType.LOCAL,
            defaultAIProvider: 'copilot',
            severityThreshold: IssueSeverity.LOW,
            supportedLanguages: ['javascript', 'typescript'],
            autoCache: true,
            reviewTemplate: this.getDefaultReviewTemplate()
        };
    }

    private getDefaultReviewTemplate(): string {
        return `Please review the following code changes and provide feedback in this format:

Issue Level: [Low/Medium/High/Critical]
Issue: [Brief description of the issue]
Suggestions:
- [Specific suggestion with code example if applicable]
- [Additional suggestions as needed]

Focus on:
- Code quality and best practices
- Security concerns
- Performance implications
- Maintainability
- Testing considerations`;
    }

    private async loadUserPreferences(): Promise<void> {
        const saved = await this.storageManager.getUserPreferences();
        if (saved) {
            this.userPreferences = { ...this.userPreferences, ...saved };
        }
    }

    public getReviewResults(): ReviewResult[] {
        return this.reviewResults;
    }

    public getUserPreferences(): UserPreferences {
        return this.userPreferences;
    }

    public async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        await this.storageManager.saveUserPreferences(this.userPreferences);
    }

    private async showInstallationGuidance(providerId: string): Promise<void> {
        const guidance = this.aiProviderManager.getInstallationGuidance(providerId);
        const providerName = this.aiProviderManager.getProviderName(providerId);
        
        const action = await vscode.window.showInformationMessage(
            `${providerName} is not installed. ${guidance}`,
            'Open Extensions Marketplace',
            'Copy Extension ID',
            'Cancel'
        );

        switch (action) {
            case 'Open Extensions Marketplace':
                // Open VS Code extensions marketplace
                vscode.commands.executeCommand('workbench.extensions.search', providerName);
                break;
                
            case 'Copy Extension ID': {
                // Copy the extension ID to clipboard for manual installation
                const extensionId = this.aiProviderManager.getExtensionId(providerId);
                if (extensionId) {
                    await vscode.env.clipboard.writeText(extensionId);
                    vscode.window.showInformationMessage(`Extension ID copied to clipboard: ${extensionId}`);
                }
                break;
            }
                
            case 'Cancel':
            default:
                break;
        }
    }

    public async showAIProviders(): Promise<void> {
        const allProviders = this.aiProviderManager.getAllProviders();
        
        if (allProviders.length === 0) {
            vscode.window.showInformationMessage('No AI providers configured.');
            return;
        }

        const message = allProviders.map(provider => {
            const status = provider.isInstalled ? '✅ Installed' : '❌ Not installed';
            const availability = provider.isAvailable ? 'Available' : 'Not available';
            return `${provider.name}: ${status} (${availability})`;
        }).join('\n');

        const action = await vscode.window.showInformationMessage(
            `AI Providers Status:\n\n${message}`,
            'Install Missing Extensions',
            'Refresh Status',
            'Close'
        );

        switch (action) {
            case 'Install Missing Extensions':
                // Open extensions marketplace
                vscode.commands.executeCommand('workbench.extensions.search', 'AI');
                break;
                
            case 'Refresh Status':
                // Refresh provider detection
                await this.aiProviderManager.detectInstalledProviders();
                vscode.window.showInformationMessage('Provider status refreshed!');
                break;
                
            case 'Close':
            default:
                break;
        }
    }

    public dispose(): void {
        // Cleanup resources
    }
}
