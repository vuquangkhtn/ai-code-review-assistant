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
    private lastUsedChangeType?: ChangeType;

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
        console.log('CodeReviewManager: reviewAllFiles started');
        if (!this.currentWorkspace) {
            vscode.window.showErrorMessage('No workspace is open');
            return;
        }

        try {
            const confirmation = await vscode.window.showWarningMessage(
                'This will review all files in the repository. This may take a while for large repositories. Continue?',
                'Yes', 'No'
            );
            
            if (confirmation !== 'Yes') {
                return;
            }

            console.log('CodeReviewManager: Getting all files from changeDetector');
            const changeInfo = await this.changeDetector.getAllRepositoryFiles();
            console.log('CodeReviewManager: Found', changeInfo.files.length, 'files to review');
            
            if (!changeInfo.files.length) {
                vscode.window.showInformationMessage('No files found in repository.');
                return;
            }

            vscode.window.showInformationMessage(`Found ${changeInfo.files.length} files to review.`);
            console.log('CodeReviewManager: Starting performReview');
            await this.performReview(changeInfo);
            console.log('CodeReviewManager: performReview completed');
        } catch (error) {
            console.error('CodeReviewManager: reviewAllFiles error:', error);
            vscode.window.showErrorMessage(`Failed to review all files: ${error}`);
        }
    }

    public async reviewFilesByType(): Promise<void> {
        try {
            const fileTypes = await this.showFileTypeSelection();
            if (!fileTypes || fileTypes.length === 0) {
                return;
            }

            const changeInfo = await this.changeDetector.getFilesByType(fileTypes);
            if (!changeInfo.files.length) {
                vscode.window.showInformationMessage(`No files found with extensions: ${fileTypes.join(', ')}`);
                return;
            }

            vscode.window.showInformationMessage(`Found ${changeInfo.files.length} files to review.`);
            await this.performReview(changeInfo);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to review files by type: ${error}`);
        }
    }

    public async reviewFilesByDirectory(): Promise<void> {
        try {
            const directories = await this.showDirectorySelection();
            if (!directories || directories.length === 0) {
                return;
            }

            const changeInfo = await this.changeDetector.getFilesByDirectory(directories);
            if (!changeInfo.files.length) {
                vscode.window.showInformationMessage(`No files found in directories: ${directories.join(', ')}`);
                return;
            }

            vscode.window.showInformationMessage(`Found ${changeInfo.files.length} files to review.`);
            await this.performReview(changeInfo);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to review files by directory: ${error}`);
        }
    }

    public async reviewAllFilesIncludingSkipped(): Promise<void> {
        try {
            const confirmation = await vscode.window.showWarningMessage(
                'This will review ALL files in the repository, including configuration files, package files, and other typically skipped files. This may take a while and generate many issues. Continue?',
                'Yes', 'No'
            );
            
            if (confirmation !== 'Yes') {
                return;
            }

            const changeInfo = await this.changeDetector.getAllFilesIncludingSkipped();
            if (!changeInfo.files.length) {
                vscode.window.showInformationMessage('No files found in repository.');
                return;
            }

            vscode.window.showInformationMessage(`Found ${changeInfo.files.length} files to review (including typically skipped files).`);
            await this.performReview(changeInfo);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to review all files including skipped: ${error}`);
        }
    }

    private async performReview(changeInfo: ChangeInfo): Promise<void> {
        console.log('CodeReviewManager: performReview started');
        const aiProvider = await this.selectAIProvider();
        if (!aiProvider) {
            console.log('CodeReviewManager: No AI provider selected');
            return;
        }
        console.log('CodeReviewManager: Selected AI provider:', aiProvider);

        const reviewOptions = await this.getReviewOptions();
        const reviewRequest: ReviewRequest = {
            changeInfo,
            aiProvider,
            options: reviewOptions
        };
        console.log('CodeReviewManager: Created review request with', changeInfo.files.length, 'files');

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'AI Code Review in Progress...',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Analyzing changes...' });
            
            try {
                console.log('CodeReviewManager: Calling aiProviderManager.performReview');
                const result = await this.aiProviderManager.performReview(reviewRequest);
                console.log('CodeReviewManager: Received result with', result.issues?.length || 0, 'issues');
                console.log('CodeReviewManager: Result summary:', result.summary);
                
                this.reviewResults.push(result);
                console.log('CodeReviewManager: Added result to reviewResults array, total:', this.reviewResults.length);
                
                await this.storageManager.saveReviewResult(result);
                console.log('CodeReviewManager: Saved result to storage');
                
                progress.report({ message: 'Review completed!' });
                this.showReviewResults(result);
            } catch (error) {
                console.error('CodeReviewManager: performReview error:', error);
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
        // First try to use the cached/default provider
        const defaultProvider = this.aiProviderManager.getDefaultProvider();
        if (defaultProvider) {
            console.log(`Using cached AI provider: ${defaultProvider}`);
            return defaultProvider;
        }

        // If no cached provider or it's not available, prompt user
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
            placeHolder: 'Select AI provider for review (this will be cached for future use)'
        });

        if (!selected) return undefined;

        const provider = allProviders.find(p => p.id === selected.value);
        if (provider && !provider.isInstalled) {
            // Show installation guidance for uninstalled providers
            await this.showInstallationGuidance(provider.id);
            return undefined; // Don't proceed with uninstalled provider
        }

        // Cache the selected provider for future use
        if (selected.value) {
            await this.aiProviderManager.setCachedProvider(selected.value);
            console.log(`Cached AI provider: ${selected.value}`);
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
        
        // Set context to show/hide the issues panel based on whether there are issues
        vscode.commands.executeCommand('setContext', 'aiCodeReview.hasIssues', result.summary.totalIssues > 0);
        
        vscode.window.showInformationMessage(message, 'View Results').then(selection => {
            console.log('User clicked:', selection);
            if (selection === 'View Results') {
                console.log('Navigating to AI Code Review Issues panel');
                // Focus on the AI Code Review activity bar and Issues panel
                vscode.commands.executeCommand('aiCodeReview.issuesPanel.focus').then(() => {
                    console.log('Successfully focused on Issues panel');
                    // Refresh the issues to ensure latest data is shown
                    vscode.commands.executeCommand('aiCodeReview.refreshIssues');
                }, (error) => {
                    console.error('Failed to focus on Issues panel:', error);
                    // Fallback: try to refresh issues anyway
                    vscode.commands.executeCommand('aiCodeReview.refreshIssues');
                });
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

    private async showFileTypeSelection(): Promise<string[] | undefined> {
        const commonFileTypes = [
            { label: 'JavaScript (.js)', value: '.js' },
            { label: 'TypeScript (.ts)', value: '.ts' },
            { label: 'React (.jsx, .tsx)', value: ['.jsx', '.tsx'] },
            { label: 'Python (.py)', value: '.py' },
            { label: 'Java (.java)', value: '.java' },
            { label: 'C# (.cs)', value: '.cs' },
            { label: 'HTML (.html)', value: '.html' },
            { label: 'CSS (.css)', value: '.css' },
            { label: 'JSON (.json)', value: '.json' },
            { label: 'Markdown (.md)', value: '.md' },
            { label: 'Custom...', value: 'custom' }
        ];

        const selected = await vscode.window.showQuickPick(commonFileTypes, {
            canPickMany: true,
            placeHolder: 'Select file types to review'
        });

        if (!selected || selected.length === 0) {
            return undefined;
        }

        let fileTypes: string[] = [];
        for (const item of selected) {
            if (item.value === 'custom') {
                const customTypes = await vscode.window.showInputBox({
                    prompt: 'Enter file extensions separated by commas (e.g., .go,.rs,.cpp)',
                    placeHolder: '.go,.rs,.cpp'
                });
                if (customTypes) {
                    const types = customTypes.split(',').map(t => t.trim()).filter(t => t.length > 0);
                    fileTypes.push(...types);
                }
            } else if (Array.isArray(item.value)) {
                fileTypes.push(...item.value);
            } else {
                fileTypes.push(item.value);
            }
        }

        return fileTypes.length > 0 ? fileTypes : undefined;
    }

    private async showDirectorySelection(): Promise<string[] | undefined> {
        // Get common directories from the workspace
        const workspaceRoot = this.currentWorkspace?.uri.fsPath;
        if (!workspaceRoot) {
            return undefined;
        }

        const commonDirectories = [
            { label: 'src/', value: 'src' },
            { label: 'lib/', value: 'lib' },
            { label: 'components/', value: 'components' },
            { label: 'utils/', value: 'utils' },
            { label: 'services/', value: 'services' },
            { label: 'pages/', value: 'pages' },
            { label: 'tests/', value: 'tests' },
            { label: 'docs/', value: 'docs' },
            { label: 'Custom...', value: 'custom' }
        ];

        const selected = await vscode.window.showQuickPick(commonDirectories, {
            canPickMany: true,
            placeHolder: 'Select directories to review'
        });

        if (!selected || selected.length === 0) {
            return undefined;
        }

        let directories: string[] = [];
        for (const item of selected) {
            if (item.value === 'custom') {
                const customDirs = await vscode.window.showInputBox({
                    prompt: 'Enter directory paths separated by commas (e.g., src/components,lib/utils)',
                    placeHolder: 'src/components,lib/utils'
                });
                if (customDirs) {
                    const dirs = customDirs.split(',').map(d => d.trim()).filter(d => d.length > 0);
                    directories.push(...dirs);
                }
            } else {
                directories.push(item.value);
            }
        }

        return directories.length > 0 ? directories : undefined;
    }

    private async loadUserPreferences(): Promise<void> {
        const saved = await this.storageManager.getUserPreferences();
        if (saved) {
            this.userPreferences = { ...this.userPreferences, ...saved };
        }
    }

    public getReviewResults(): ReviewResult[] {
        // If no results in memory, try to load from storage synchronously
        if (this.reviewResults.length === 0) {
            try {
                const storedResults = this.storageManager.getReviewResults();
                this.reviewResults = storedResults || [];
                console.log('Loaded review results from storage:', this.reviewResults.length, 'results');
            } catch (error) {
                console.error('Failed to load review results from storage:', error);
                this.reviewResults = [];
            }
        }
        return this.reviewResults;
    }

    private async loadReviewResultsFromStorage(): Promise<void> {
        try {
            const storedResults = this.storageManager.getReviewResults();
            this.reviewResults = storedResults || [];
            console.log('Async loaded review results from storage:', this.reviewResults.length, 'results');
        } catch (error) {
            console.error('Failed to load review results from storage:', error);
            this.reviewResults = [];
        }
    }

    public async clearReviewResults(): Promise<void> {
        await this.storageManager.clearAllReviewResults();
        this.reviewResults = [];
    }

    public getUserPreferences(): UserPreferences {
        return this.userPreferences;
    }

    public async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        await this.storageManager.saveUserPreferences(this.userPreferences);
    }

    public async createReviewRequest(changeType?: ChangeType): Promise<ReviewRequest | undefined> {
        let changeInfo: ChangeInfo;
        
        if (changeType) {
            // Store the change type for future use
            this.lastUsedChangeType = changeType;
            
            switch (changeType) {
                case ChangeType.LOCAL: {
                    changeInfo = await this.changeDetector.detectLocalChanges();
                    break;
                }
                case ChangeType.COMMIT: {
                    const commitHash = await this.showCommitSelector();
                    if (!commitHash) return undefined;
                    changeInfo = await this.changeDetector.detectCommitChanges(commitHash);
                    break;
                }
                case ChangeType.BRANCH: {
                    const branchSelection = await this.showBranchSelector();
                    if (!branchSelection) return undefined;
                    changeInfo = await this.changeDetector.detectBranchChanges(branchSelection.sourceBranch, branchSelection.targetBranch);
                    break;
                }
                case ChangeType.ALL_FILES: {
                    changeInfo = await this.changeDetector.getAllRepositoryFiles();
                    break;
                }
                default:
                    throw new Error(`Unsupported change type: ${changeType}`);
            }
        } else {
            const selectedChangeType = await this.showChangeTypeSelector();
            if (!selectedChangeType) return undefined;
            this.lastUsedChangeType = selectedChangeType;
            return this.createReviewRequest(selectedChangeType);
        }

        const aiProvider = await this.selectAIProvider();
        if (!aiProvider) return undefined;

        const reviewOptions = await this.getReviewOptions();
        
        return {
            changeInfo,
            aiProvider,
            options: reviewOptions
        };
    }

    /**
     * Creates a review request using the last used change type
     * This is useful for paste operations to avoid re-asking for change type
     */
    public async createReviewRequestWithLastChangeType(): Promise<ReviewRequest | undefined> {
        if (!this.lastUsedChangeType) {
            vscode.window.showWarningMessage('No previous change type found. Please copy a prompt first.');
            return undefined;
        }
        
        return this.createReviewRequest(this.lastUsedChangeType);
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
