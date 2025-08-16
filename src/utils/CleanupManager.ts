import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class CleanupManager {
    /**
     * Selectively cleans up files in specific subdirectories of .ai-code-review
     * Only removes files when new files are generated in those folders
     * @param foldersToClean Array of folder names to clean ('prompts', 'changes', 'results')
     */
    public static async cleanupSelectiveDirectories(foldersToClean: string[] = ['prompts', 'changes', 'results']): Promise<void> {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder found');
            }

            const aiReviewDir = path.join(workspaceRoot, '.ai-code-review');
            
            // Check if the directory exists
            if (!fs.existsSync(aiReviewDir)) {
                return;
            }

            // Clean up only specified subdirectories
            for (const subdir of foldersToClean) {
                const subdirPath = path.join(aiReviewDir, subdir);
                if (fs.existsSync(subdirPath)) {
                    await this.cleanupDirectory(subdirPath);
                }
            }

        } catch (error) {
            console.error('Error cleaning up AI review directories:', error);
            throw error;
        }
    }

    /**
     * Completely removes the entire .ai-code-review directory
     * Used during extension deactivation or complete cleanup
     */
    public static async cleanupCompleteDirectory(): Promise<void> {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                return;
            }

            const aiReviewDir = path.join(workspaceRoot, '.ai-code-review');
            
            // Check if the directory exists
            if (!fs.existsSync(aiReviewDir)) {
                return;
            }

            // Remove the entire directory and all its contents
            await this.cleanupDirectory(aiReviewDir);
            
            // Remove the directory itself
            if (fs.existsSync(aiReviewDir)) {
                fs.rmdirSync(aiReviewDir);
            }

        } catch (error) {
            console.error('Error completely cleaning up AI review directory:', error);
            throw error;
        }
    }

    /**
     * Legacy method - now calls selective cleanup for backward compatibility
     * @deprecated Use cleanupSelectiveDirectories or cleanupCompleteDirectory instead
     */
    public static async cleanupAIReviewDirectory(): Promise<void> {
        return this.cleanupSelectiveDirectories();
    }

    /**
     * Recursively cleans up a directory by removing all files and subdirectories
     * @param dirPath The directory path to clean
     */
    private static async cleanupDirectory(dirPath: string): Promise<void> {
        if (!fs.existsSync(dirPath)) {
            return;
        }

        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // Recursively clean subdirectory
                await this.cleanupDirectory(filePath);
                // Remove the empty directory
                fs.rmdirSync(filePath);
            } else {
                // Remove file
                fs.unlinkSync(filePath);
            }
        }
    }

    /**
     * Gets the count of files in the .ai-code-review directory
     * Useful for showing cleanup statistics
     */
    public static getFileCount(): { prompts: number; changes: number; results: number; total: number } {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                return { prompts: 0, changes: 0, results: 0, total: 0 };
            }

            const aiReviewDir = path.join(workspaceRoot, '.ai-code-review');
            
            if (!fs.existsSync(aiReviewDir)) {
                return { prompts: 0, changes: 0, results: 0, total: 0 };
            }

            const counts = { prompts: 0, changes: 0, results: 0, total: 0 };
            const subdirs = ['prompts', 'changes', 'results'] as const;
            
            for (const subdir of subdirs) {
                const subdirPath = path.join(aiReviewDir, subdir);
                if (fs.existsSync(subdirPath)) {
                    const files = fs.readdirSync(subdirPath).filter(file => {
                        const filePath = path.join(subdirPath, file);
                        return fs.statSync(filePath).isFile();
                    });
                    counts[subdir] = files.length;
                    counts.total += files.length;
                }
            }

            // Count any legacy files directly in .ai-code-review
            const files = fs.readdirSync(aiReviewDir).filter(file => {
                const filePath = path.join(aiReviewDir, file);
                return fs.statSync(filePath).isFile();
            });
            counts.total += files.length;

            return counts;
        } catch (error) {
            console.error('Error getting file count:', error);
            return { prompts: 0, changes: 0, results: 0, total: 0 };
        }
    }
}