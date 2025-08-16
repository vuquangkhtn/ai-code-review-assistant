import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import * as path from 'path';
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
        const status = await this.git.status();
        const changedFiles: ChangedFile[] = [];

        // Process modified files
        for (const file of status.modified) {
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
            changedFiles.push({
                path: file,
                status: 'added'
            });
        }

        // Process deleted files
        for (const file of status.deleted) {
            changedFiles.push({
                path: file,
                status: 'deleted'
            });
        }

        // Process renamed files
        for (const file of status.renamed) {
            changedFiles.push({
                path: file.to,
                status: 'renamed'
            });
        }

        return {
            type: ChangeType.LOCAL,
            source: 'working directory',
            files: changedFiles
        };
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
            const additions = this.countAdditions(diff);
            const deletions = this.countDeletions(diff);

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
                diff
            });
        }

        return changedFiles;
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
            // Get all tracked files in the repository
            const files = await this.git.raw(['ls-files']);
            const fileList = files.trim().split('\n').filter((file: string) => file.length > 0);
            
            console.log(`Found ${fileList.length} tracked files in repository`);
            
            const changedFiles: ChangedFile[] = [];
            
            for (const file of fileList) {
                // Skip binary files and common non-code files
                if (this.shouldSkipFile(file)) {
                    console.log(`Skipping file: ${file}`);
                    continue;
                }
                
                try {
                    // Get file content for analysis
                    const content = await vscode.workspace.fs.readFile(
                        vscode.Uri.file(path.join(this.workspacePath, file))
                    );
                    
                    const fileContent = content.toString();
                    console.log(`Processing file: ${file} (${fileContent.length} characters)`);
                    
                    changedFiles.push({
                        path: file,
                        status: 'modified',
                        additions: 0,
                        deletions: 0,
                        diff: fileContent
                    });
                } catch (error) {
                    console.log(`Failed to read file ${file}: ${error}`);
                    continue;
                }
            }
            
            console.log(`Final result: ${changedFiles.length} files to review`);
            
            return {
                type: ChangeType.ALL_FILES,
                source: 'repository',
                files: changedFiles
            };
        } catch (error) {
            throw new Error(`Failed to get all repository files: ${error}`);
        }
    }
    
    private shouldSkipFile(filePath: string): boolean {
        const skipExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.zip', '.tar', '.gz'];
        const skipDirectories = ['node_modules', '.git', 'dist', 'build', 'out', '.vscode'];
        const skipFiles = ['.gitignore', '.npmignore', 'package-lock.json', 'yarn.lock'];
        
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
        
        // Check specific files
        const fileName = path.basename(filePath);
        if (skipFiles.includes(fileName)) {
            return true;
        }
        
        return false;
    }
}
