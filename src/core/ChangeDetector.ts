import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { 
    ChangeInfo, 
    ChangedFile, 
    ChangeType 
} from '../types';


interface GitCommit {
    hash: string;
    message: string;
    author: string;
    date: Date;
}

export class ChangeDetector {
    private git: any;
    private workspacePath: string = '';

    constructor() {
        this.git = simpleGit();
    }

    public async initialize(workspace: vscode.WorkspaceFolder): Promise<void> {
        this.workspacePath = workspace.uri.fsPath;
        this.git = simpleGit(this.workspacePath);
        
        // Check if this is a git repository
        try {
            await this.git.status();
        } catch (error) {
            throw new Error('Not a git repository. Please initialize git in this workspace.');
        }
    }

    public async detectLocalChanges(): Promise<ChangeInfo> {
        try {
            // Try git-based detection first
            const status = await this.git.status();
            const changedFiles: ChangedFile[] = [];

            // Process modified files
            for (const file of status.modified) {
                // Skip files that shouldn't be reviewed
                if (this.shouldSkipFile(file)) {
                    continue;
                }
                
                const diff = await this.git.diff([file]);
                changedFiles.push({
                    path: file,
                    status: 'modified',
                    additions: this.countAdditions(diff),
                    deletions: this.countDeletions(diff),
                    diff
                });
            }

            // Process added files
            for (const file of status.created) {
                // Skip files that shouldn't be reviewed
                if (this.shouldSkipFile(file)) {
                    continue;
                }
                
                try {
                    const filePath = path.join(this.workspacePath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const lines = content.split('\n');
                    
                    changedFiles.push({
                        path: file,
                        status: 'added',
                        additions: lines.length,
                        deletions: 0,
                        diff: content
                    });
                } catch (error) {
                    // If we can't read the file, add it without content
                    changedFiles.push({
                        path: file,
                        status: 'added'
                    });
                }
            }

            // Process deleted files
            for (const file of status.deleted) {
                // Skip files that shouldn't be reviewed
                if (this.shouldSkipFile(file)) {
                    continue;
                }
                
                changedFiles.push({
                    path: file,
                    status: 'deleted'
                });
            }

            // Process renamed files
            for (const file of status.renamed) {
                // Skip files that shouldn't be reviewed
                if (this.shouldSkipFile(file.to)) {
                    continue;
                }
                
                changedFiles.push({
                    path: file.to,
                    status: 'renamed'
                });
            }

            // Process untracked files (not_added)
            for (const file of status.not_added || []) {
                // Skip files that shouldn't be reviewed
                if (this.shouldSkipFile(file)) {
                    continue;
                }
                
                try {
                    const filePath = path.join(this.workspacePath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const lines = content.split('\n');
                    
                    changedFiles.push({
                        path: file,
                        status: 'added',
                        additions: lines.length,
                        deletions: 0,
                        diff: content
                    });
                } catch (error) {
                    // If we can't read the file, add it without content
                    changedFiles.push({
                        path: file,
                        status: 'added'
                    });
                }
            }

            return {
                type: ChangeType.LOCAL,
                source: 'working directory',
                files: changedFiles
            };
        } catch (error) {
            // Fallback for non-git workspaces
            return this.detectWorkspaceFiles();
        }
    }

    public async detectWorkspaceFiles(): Promise<ChangeInfo> {
        const changedFiles: ChangedFile[] = [];
        
        if (!this.workspacePath) {
            // Use current workspace if not set
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                this.workspacePath = workspaceFolder.uri.fsPath;
            } else {
                throw new Error('No workspace folder found');
            }
        }
        
        // Scan workspace files
        const files = await this.scanDirectory(this.workspacePath);
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const relativePath = path.relative(this.workspacePath, file);
                const lines = content.split('\n');
                
                changedFiles.push({
                    path: relativePath,
                    status: 'summary',
                    additions: lines.length,
                    deletions: 0,
                    diff: content
                });
            } catch (error) {
                // Skip files that can't be read
                continue;
            }
        }
        
        return {
            type: ChangeType.LOCAL,
            source: 'workspace files',
            files: changedFiles
        };
    }

    private async scanDirectory(dirPath: string): Promise<string[]> {
        const files: string[] = [];
        
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip common directories that shouldn't be reviewed
                    if (this.shouldSkipDirectory(fullPath)) {
                        continue;
                    }
                    
                    const subFiles = await this.scanDirectory(fullPath);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    // Skip files that shouldn't be reviewed
                    if (this.shouldSkipFile(fullPath)) {
                        continue;
                    }
                    
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }
        
        return files;
    }

    public async detectAndStoreLocalChanges(): Promise<{ changeInfo: ChangeInfo; filePath: string }> {
        const changeInfo = await this.detectLocalChanges();
        const filePath = await this.storeChangesToFile(changeInfo);
        return { changeInfo, filePath };
    }

    private async storeChangesToFile(changeInfo: ChangeInfo): Promise<string> {
        const aiReviewDir = path.join(this.workspacePath, '.ai-code-review');
        const changesDir = path.join(aiReviewDir, 'changes');
        
        // Create the .ai-code-review and changes directories if they don't exist
        if (!fs.existsSync(aiReviewDir)) {
            fs.mkdirSync(aiReviewDir, { recursive: true });
            // Automatically add to .gitignore when creating the directory for the first time
            await this.ensureGitignoreEntry();
        }
        if (!fs.existsSync(changesDir)) {
            fs.mkdirSync(changesDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `ai-code-review-changes-${timestamp}.json`;
        const filePath = path.join(changesDir, fileName);
        
        const content = JSON.stringify(changeInfo, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
        
        return filePath;
    }

    private async ensureGitignoreEntry(): Promise<void> {
        const gitignorePath = path.join(this.workspacePath, '.gitignore');
        const gitignoreEntry = '.ai-code-review/';
        
        try {
            let gitignoreContent = '';
            
            // Read existing .gitignore if it exists
            if (fs.existsSync(gitignorePath)) {
                gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
                
                // Check if the entry already exists
                if (gitignoreContent.includes(gitignoreEntry)) {
                    return; // Entry already exists
                }
            }
            
            // Add the entry to .gitignore
            const newEntry = gitignoreContent.endsWith('\n') || gitignoreContent === '' 
                ? `\n# AI Code Review temporary files\n${gitignoreEntry}\n`
                : `\n\n# AI Code Review temporary files\n${gitignoreEntry}\n`;
            
            fs.writeFileSync(gitignorePath, gitignoreContent + newEntry, 'utf8');
            
            // Show a notification to the user
            vscode.window.showInformationMessage(
                'Added .ai-code-review/ to .gitignore to prevent temporary files from being committed.'
            );
        } catch (error) {
            console.warn('Failed to update .gitignore:', error);
            // Don't throw error as this is not critical for the main functionality
        }
    }

    public async detectCommitChanges(commitHash: string): Promise<ChangeInfo> {
        const diff = await this.git.diff([`${commitHash}^`, commitHash]);
        const changedFiles = this.parseDiffOutput(diff);

        return {
            type: ChangeType.COMMIT,
            source: commitHash,
            files: changedFiles
        };
    }

    public async detectBranchChanges(sourceBranch: string, targetBranch: string): Promise<ChangeInfo> {
        const diff = await this.git.diff([sourceBranch, targetBranch]);
        const changedFiles = this.parseDiffOutput(diff);

        return {
            type: ChangeType.BRANCH,
            source: sourceBranch,
            target: targetBranch,
            files: changedFiles
        };
    }

    public async getRecentCommits(limit: number = 10): Promise<GitCommit[]> {
        const log = await this.git.log({ maxCount: limit });
        return log.all.map((commit: any) => ({
            hash: commit.hash,
            message: commit.message,
            author: commit.author_name,
            date: new Date(commit.date)
        }));
    }

    public async getBranches(): Promise<string[]> {
        const branches = await this.git.branch();
        return branches.all;
    }

    public async getDefaultSourceBranch(): Promise<string | null> {
        const branches = await this.getBranches();
        const defaultBranches = ['develop', 'main', 'master'];
        
        for (const defaultBranch of defaultBranches) {
            if (branches.includes(defaultBranch)) {
                return defaultBranch;
            }
        }
        
        return null;
    }

    public async detectAndStoreBranchChanges(sourceBranch: string, targetBranch: string): Promise<{ changeInfo: ChangeInfo; filePath: string }> {
        const changeInfo = await this.detectBranchChanges(sourceBranch, targetBranch);
        const filePath = await this.storeChangesToFile(changeInfo);
        return { changeInfo, filePath };
    }

    public async getCurrentBranch(): Promise<string> {
        const status = await this.git.status();
        return status.current || '';
    }

    public async getFileContent(filePath: string, commitHash?: string): Promise<string> {
        try {
            if (commitHash) {
                return await this.git.show([`${commitHash}:${filePath}`]);
            } else {
                const fullPath = path.join(this.workspacePath, filePath);
                const uri = vscode.Uri.file(fullPath);
                const document = await vscode.workspace.openTextDocument(uri);
                return document.getText();
            }
        } catch (error) {
            throw new Error(`Failed to get file content for ${filePath}: ${error}`);
        }
    }

    private parseDiffOutput(diff: string): ChangedFile[] {
        const changedFiles: ChangedFile[] = [];
        const filePattern = /^diff --git a\/(.+) b\/(.+)$/gm;
        let match;

        while ((match = filePattern.exec(diff)) !== null) {
            const filePath = match[1];
            
            // Skip files that shouldn't be reviewed
            if (this.shouldSkipFile(filePath)) {
                continue;
            }
            
            // Extract file-specific diff
            const fileDiff = this.extractFileDiff(diff, filePath);
            const enhancedDiff = this.enhanceDiffWithLineNumbers(fileDiff);
            
            const additions = this.countAdditions(fileDiff);
            const deletions = this.countDeletions(fileDiff);

            let status: 'modified' | 'added' | 'deleted' | 'renamed' = 'modified';
            if (additions > 0 && deletions === 0) {
                status = 'added';
            } else if (additions === 0 && deletions > 0) {
                status = 'deleted';
            }

            changedFiles.push({
                path: filePath,
                status,
                additions,
                deletions,
                diff: enhancedDiff
            });
        }

        return changedFiles;
    }

    private extractFileDiff(fullDiff: string, filePath: string): string {
        const fileStartPattern = new RegExp(`^diff --git a/${filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} b/${filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm');
        const nextFilePattern = /^diff --git a\//gm;
        
        const startMatch = fileStartPattern.exec(fullDiff);
        if (!startMatch) {
            return fullDiff;
        }
        
        const startIndex = startMatch.index;
        nextFilePattern.lastIndex = startIndex + startMatch[0].length;
        const nextMatch = nextFilePattern.exec(fullDiff);
        
        if (nextMatch) {
            return fullDiff.substring(startIndex, nextMatch.index);
        } else {
            return fullDiff.substring(startIndex);
        }
    }
    
    private enhanceDiffWithLineNumbers(diff: string): string {
        const lines = diff.split('\n');
        const enhancedLines: string[] = [];
        let currentOldLine = 0;
        let currentNewLine = 0;
        
        for (const line of lines) {
            // Parse hunk headers to get line numbers
            const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
            if (hunkMatch) {
                currentOldLine = parseInt(hunkMatch[1]);
                currentNewLine = parseInt(hunkMatch[3]);
                enhancedLines.push(line + ` // OLD_START: ${currentOldLine}, NEW_START: ${currentNewLine}`);
                continue;
            }
            
            // Add line number comments for context
            if (line.startsWith('+')) {
                enhancedLines.push(line + ` // LINE: ${currentNewLine}`);
                currentNewLine++;
            } else if (line.startsWith('-')) {
                enhancedLines.push(line + ` // OLD_LINE: ${currentOldLine}`);
                currentOldLine++;
            } else if (line.startsWith(' ')) {
                enhancedLines.push(line + ` // LINE: ${currentNewLine}`);
                currentOldLine++;
                currentNewLine++;
            } else {
                enhancedLines.push(line);
            }
        }
        
        return enhancedLines.join('\n');
    }

    private countAdditions(diff: string): number {
        const additionPattern = /^\+/gm;
        const matches = diff.match(additionPattern);
        return matches ? matches.length : 0;
    }

    private countDeletions(diff: string): number {
        const deletionPattern = /^-/gm;
        const matches = diff.match(deletionPattern);
        return matches ? matches.length : 0;
    }

    public async isGitRepository(): Promise<boolean> {
        try {
            await this.git.status();
            return true;
        } catch {
            return false;
        }
    }

    public async getRepositoryInfo(): Promise<{ remote: string; branch: string }> {
        try {
            const remotes = await this.git.getRemotes(true);
            const status = await this.git.status();
            
            return {
                remote: remotes[0]?.refs?.fetch || '',
                branch: status.current || ''
            };
        } catch (error) {
            throw new Error(`Failed to get repository info: ${error}`);
        }
    }

    public async getAllRepositoryFiles(): Promise<ChangeInfo> {
        try {
            // Create a simple prompt template asking AI to analyze the workspace
            const workspacePrompt = [
                '# Code Review Request: Complete Repository Analysis',
                '',
                '## IMPORTANT: Analysis Instructions',
                '- Analyze the ENTIRE codebase in this workspace by exploring all files and directories',
                '- When referencing files in your response, use RELATIVE paths from the project root',
                '- Example: Use `src/components/Button.tsx` NOT `./Button.tsx` or absolute paths',
                '- Focus on actual code files, not generated files or dependencies',
                '',
                '## Analysis Scope',
                'Please analyze the entire codebase and provide a comprehensive code review covering:',
                '',
                '1. **Architecture & Design Patterns**: Evaluate the overall code structure, design patterns, and architectural decisions',
                '2. **Code Quality**: Check for code smells, maintainability issues, and adherence to best practices',
                '3. **Security**: Identify potential security vulnerabilities and suggest improvements',
                '4. **Performance**: Look for performance bottlenecks and optimization opportunities',
                '5. **Documentation**: Assess code documentation and suggest improvements',
                '6. **Testing**: Evaluate test coverage and testing strategies',
                '',
                '## Response Format Requirements',
                '**CRITICAL:** Use RELATIVE file paths from the project root in your response.',
                '',
                'Please provide your analysis in the following JSON format:',
                '',
                '```json',
                '{',
                '  "summary": "Overall assessment of the codebase",',
                '  "issues": [',
                '    {',
                '      "file": "src/path/to/file.ts",',
                '      "line": 42,',
                '      "severity": "high|medium|low",',
                '      "type": "security|performance|maintainability|style|bug",',
                '      "message": "Description of the issue",',
                '      "suggestion": "Recommended fix or improvement"',
                '    }',
                '  ],',
                '  "recommendations": [',
                '    "General recommendations for improving the codebase"',
                '  ]',
                '}',
                '```',
                '',
                '## Important Guidelines',
                '- Use RELATIVE file paths from project root (e.g., `src/components/Button.tsx`)',
                '- Focus on the most critical issues that impact code quality, security, and maintainability',
                '- Provide specific, actionable suggestions for improvements',
                '- Consider the project context and technology stack when making recommendations',
                '- Explore the entire workspace to understand the full codebase structure'
            ].join('\n');

            const changedFiles: ChangedFile[] = [{
                path: 'WORKSPACE_ANALYSIS_PROMPT.md',
                status: 'added',
                additions: workspacePrompt.split('\n').length,
                deletions: 0,
                diff: workspacePrompt
            }];

            return {
                type: ChangeType.ALL_FILES,
                source: 'workspace-prompt',
                files: changedFiles
            };
        } catch (error) {
            throw new Error(`Failed to create workspace analysis prompt: ${error}`);
        }
    }

    /**
     * Creates a repository index with file metadata instead of full content
     * This prevents massive prompts when reviewing entire repositories
     */
    public async getRepositoryIndex(): Promise<ChangeInfo> {
        try {
            // Get all tracked files in the repository
            const files = await this.git.raw(['ls-files']);
            const fileList = files.trim().split('\n').filter((file: string) => file.length > 0);
            
            const changedFiles: ChangedFile[] = [];
            const fileStats = new Map<string, { count: number; totalLines: number }>();
            
            for (const file of fileList) {
                // Skip binary files and common non-code files
                if (this.shouldSkipFile(file)) {
                    continue;
                }
                
                try {
                    const filePath = path.join(this.workspacePath, file);
                    const stats = await fs.promises.stat(filePath);
                    
                    // Get file extension for categorization
                    const ext = path.extname(file).toLowerCase();
                    const category = this.getFileCategory(ext);
                    
                    // Count lines in file
                    let lineCount = 0;
                    try {
                        const content = await fs.promises.readFile(filePath, 'utf8');
                        lineCount = content.split('\n').length;
                    } catch {
                        lineCount = 0;
                    }
                    
                    // Update category statistics
                    if (!fileStats.has(category)) {
                        fileStats.set(category, { count: 0, totalLines: 0 });
                    }
                    const catStats = fileStats.get(category)!;
                    catStats.count++;
                    catStats.totalLines += lineCount;
                    
                    // Create file metadata without full content
                    const fileMetadata = [
                        `File: ${file}`,
                        `Type: ${category}`,
                        `Size: ${stats.size} bytes`,
                        `Lines: ${lineCount}`,
                        `Modified: ${stats.mtime.toISOString()}`,
                        ''
                    ].join('\n');
                    
                    changedFiles.push({
                        path: file,
                        status: 'indexed',
                        additions: lineCount,
                        deletions: 0,
                        diff: fileMetadata
                    });
                } catch (error) {
                    // Skip files that can't be read
                    continue;
                }
            }
            
            // Add repository summary
            const summary = this.generateRepositorySummary(fileStats, changedFiles.length);
            changedFiles.unshift({
                path: 'REPOSITORY_SUMMARY.md',
                status: 'summary',
                additions: 0,
                deletions: 0,
                diff: summary
            });
            
            return {
                type: ChangeType.ALL_FILES,
                source: 'repository-index',
                files: changedFiles
            };
        } catch (error) {
            throw new Error(`Failed to create repository index: ${error}`);
        }
    }

    private getFileCategory(extension: string): string {
        const categories: { [key: string]: string } = {
            '.ts': 'TypeScript',
            '.js': 'JavaScript',
            '.tsx': 'React TypeScript',
            '.jsx': 'React JavaScript',
            '.py': 'Python',
            '.java': 'Java',
            '.c': 'C',
            '.cpp': 'C++',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.json': 'JSON',
            '.xml': 'XML',
            '.yaml': 'YAML',
            '.yml': 'YAML',
            '.md': 'Markdown',
            '.sql': 'SQL',
            '.sh': 'Shell Script',
            '.dockerfile': 'Docker',
            '.gitignore': 'Git Config',
            '.env': 'Environment'
        };
        
        return categories[extension] || 'Other';
    }
    
    private generateRepositorySummary(fileStats: Map<string, { count: number; totalLines: number }>, totalFiles: number): string {
        const summary = [
            '# Repository Analysis Summary',
            '',
            `**Total Files Analyzed:** ${totalFiles}`,
            '',
            '## File Type Distribution:',
            ''
        ];
        
        // Sort by file count
        const sortedStats = Array.from(fileStats.entries())
            .sort((a, b) => b[1].count - a[1].count);
            
        for (const [category, stats] of sortedStats) {
            summary.push(`- **${category}**: ${stats.count} files, ${stats.totalLines} total lines`);
        }
        
        summary.push('');
        summary.push('## Repository Structure:');
        summary.push('');
        summary.push('This is a repository index for AI analysis. Each file entry below contains:');
        summary.push('- File path and type');
        summary.push('- File size and line count');
        summary.push('- Last modification date');
        summary.push('');
        summary.push('**Note**: Full file content is not included to keep the prompt manageable.');
        summary.push('For detailed code review, please specify individual files or directories.');
        summary.push('');
        
        return summary.join('\n');
    }

    public async getFilesByType(fileExtensions: string[]): Promise<ChangeInfo> {
        try {
            const files = await this.git.raw(['ls-files']);
            const fileList = files.trim().split('\n').filter((file: string) => file.length > 0);
            
            const changedFiles: ChangedFile[] = [];
            
            for (const file of fileList) {
                const ext = path.extname(file).toLowerCase();
                
                // Only include files with specified extensions
                if (!fileExtensions.includes(ext)) {
                    continue;
                }
                
                // Skip if it's in a directory we should skip
                if (this.shouldSkipDirectory(file)) {
                    continue;
                }
                
                try {
                    const content = await vscode.workspace.fs.readFile(
                        vscode.Uri.file(path.join(this.workspacePath, file))
                    );
                    
                    changedFiles.push({
                        path: file,
                        status: 'modified',
                        additions: 0,
                        deletions: 0,
                        diff: content.toString()
                    });
                } catch (error) {
                    continue;
                }
            }
            
            return {
                type: ChangeType.ALL_FILES,
                source: 'repository-filtered',
                files: changedFiles
            };
        } catch (error) {
            throw new Error(`Failed to get files by type: ${error}`);
        }
    }

    public async getFilesByDirectory(directories: string[]): Promise<ChangeInfo> {
        try {
            const files = await this.git.raw(['ls-files']);
            const fileList = files.trim().split('\n').filter((file: string) => file.length > 0);
            
            const changedFiles: ChangedFile[] = [];
            
            for (const file of fileList) {
                // Check if file is in one of the specified directories
                const isInTargetDirectory = directories.some(dir => {
                    const normalizedDir = dir.endsWith('/') ? dir : dir + '/';
                    return file.startsWith(normalizedDir) || file === dir;
                });
                
                if (!isInTargetDirectory) {
                    continue;
                }
                
                // Skip binary files
                if (this.shouldSkipBinaryFile(file)) {
                    continue;
                }
                
                try {
                    const content = await vscode.workspace.fs.readFile(
                        vscode.Uri.file(path.join(this.workspacePath, file))
                    );
                    
                    changedFiles.push({
                        path: file,
                        status: 'modified',
                        additions: 0,
                        deletions: 0,
                        diff: content.toString()
                    });
                } catch (error) {
                    continue;
                }
            }
            
            return {
                type: ChangeType.ALL_FILES,
                source: 'repository-directory',
                files: changedFiles
            };
        } catch (error) {
            throw new Error(`Failed to get files by directory: ${error}`);
        }
    }

    public async getAllFilesIncludingSkipped(): Promise<ChangeInfo> {
        try {
            const files = await this.git.raw(['ls-files']);
            const fileList = files.trim().split('\n').filter((file: string) => file.length > 0);
            
            const changedFiles: ChangedFile[] = [];
            
            for (const file of fileList) {
                // Only skip truly binary files that can't be read as text
                if (this.shouldSkipBinaryFile(file)) {
                    continue;
                }
                
                try {
                    const content = await vscode.workspace.fs.readFile(
                        vscode.Uri.file(path.join(this.workspacePath, file))
                    );
                    
                    changedFiles.push({
                        path: file,
                        status: 'modified',
                        additions: 0,
                        deletions: 0,
                        diff: content.toString()
                    });
                } catch (error) {
                    continue;
                }
            }
            
            return {
                type: ChangeType.ALL_FILES,
                source: 'repository-complete',
                files: changedFiles
            };
        } catch (error) {
            throw new Error(`Failed to get all files including skipped: ${error}`);
        }
    }
    
    private shouldSkipFile(filePath: string): boolean {
        const skipExtensions = [
            // Images
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff',
            // Archives and binaries
            '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z', '.dmg', '.pkg', '.deb', '.rpm',
            // Executables and libraries
            '.exe', '.dll', '.so', '.dylib',
            // Fonts
            '.ttf', '.otf', '.woff', '.woff2', '.eot',
            // Media files
            '.mp4', '.avi', '.mov', '.webm', '.mp3', '.wav', '.ogg',
            // Compiled/generated files
            '.min.js', '.min.css', '.map',
            // Database and cache files
            '.db', '.sqlite', '.sqlite3', '.cache', '.tmp', '.temp'
        ];
        const skipDirectories = [
            'node_modules', '.git', 'dist', 'build', 'out', '.vscode',
            // Additional config and cache directories
            '.next', '.nuxt', 'coverage', '.nyc_output', '.pytest_cache',
            '__pycache__', '.venv', 'venv', 'env'
        ];
        const skipFiles = [
            '.gitignore', '.npmignore', 'package-lock.json', 'yarn.lock',
            // Auto-generated documentation
            'CHANGELOG.md', 'LICENSE', 'AUTHORS'
        ];
        
        // Check if file is in a directory we should skip
        for (const dir of skipDirectories) {
            if (filePath.includes(`${dir}/`) || filePath.startsWith(`${dir}/`)) {
                return true;
            }
        }
        
        // Check file extension
        const ext = path.extname(filePath).toLowerCase();
        if (skipExtensions.includes(ext)) {
            return true;
        }
        
        // Check for TypeScript declaration files (often auto-generated)
        if (ext === '.ts' && filePath.endsWith('.d.ts')) {
            return true;
        }
        
        // Check specific files
        const fileName = path.basename(filePath);
        if (skipFiles.includes(fileName)) {
            return true;
        }
        
        return false;
    }

    private shouldSkipDirectory(filePath: string): boolean {
        const skipDirectories = [
            'node_modules', '.git', 'dist', 'build', 'out', '.vscode',
            // Additional config and cache directories
            '.next', '.nuxt', 'coverage', '.nyc_output', '.pytest_cache',
            '__pycache__', '.venv', 'venv', 'env'
        ];
        
        // Check if file is in a directory we should skip
        for (const dir of skipDirectories) {
            if (filePath.includes(`${dir}/`) || filePath.startsWith(`${dir}/`)) {
                return true;
            }
        }
        
        return false;
    }

    private shouldSkipBinaryFile(filePath: string): boolean {
        const binaryExtensions = [
            // Images
            '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp', '.tiff', '.svg',
            // Archives and binaries
            '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z', '.dmg', '.pkg', '.deb', '.rpm',
            // Executables and libraries
            '.exe', '.dll', '.so', '.dylib',
            // Fonts
            '.ttf', '.otf', '.woff', '.woff2', '.eot',
            // Media files
            '.mp4', '.avi', '.mov', '.webm', '.mp3', '.wav', '.ogg',
            // Database and cache files
            '.db', '.sqlite', '.sqlite3'
        ];
        
        const ext = path.extname(filePath).toLowerCase();
        return binaryExtensions.includes(ext);
    }
}
