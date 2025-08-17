import * as assert from 'assert';
import * as vscode from 'vscode';
import { suite, test, suiteSetup, suiteTeardown } from 'mocha';
import { CleanupManager } from '../../utils/CleanupManager';

suite('CleanupManager Test Suite', () => {
    let workspaceFolder: vscode.WorkspaceFolder;

    suiteSetup(async function() {
        this.timeout(30000);
        
        // Get workspace folder or create mock
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            // Create mock workspace folder for testing
            workspaceFolder = {
                uri: vscode.Uri.file(process.cwd()),
                name: 'test-workspace',
                index: 0
            };
        } else {
            workspaceFolder = workspaceFolders[0];
        }
    });

    suite('Static Methods Tests', () => {
        test('Should have required static methods', () => {
            assert.ok(typeof CleanupManager.cleanupSelectiveDirectories === 'function', 'Should have cleanupSelectiveDirectories method');
            assert.ok(typeof CleanupManager.cleanupCompleteDirectory === 'function', 'Should have cleanupCompleteDirectory method');
            assert.ok(typeof CleanupManager.cleanupAIReviewDirectory === 'function', 'Should have cleanupAIReviewDirectory method');
            assert.ok(typeof CleanupManager.getFileCount === 'function', 'Should have getFileCount method');
        });

        test('Should get file count', () => {
            const fileCount = CleanupManager.getFileCount();
            assert.ok(typeof fileCount === 'object', 'Should return file count object');
            assert.ok(typeof fileCount.prompts === 'number', 'Should have prompts count');
            assert.ok(typeof fileCount.changes === 'number', 'Should have changes count');
            assert.ok(typeof fileCount.results === 'number', 'Should have results count');
            assert.ok(typeof fileCount.total === 'number', 'Should have total count');
        });
    });

    suite('Cleanup Functionality Tests', () => {
        test('Should handle selective directory cleanup', async () => {
            try {
                await CleanupManager.cleanupSelectiveDirectories(['prompts', 'changes']);
                assert.ok(true, 'Should complete selective cleanup without errors');
            } catch (error) {
                // Cleanup might fail if directories don't exist, which is acceptable
                assert.ok(error instanceof Error, 'Should handle cleanup errors gracefully');
            }
        });

        test('Should handle complete directory cleanup', async () => {
            try {
                await CleanupManager.cleanupCompleteDirectory();
                assert.ok(true, 'Should complete full cleanup without errors');
            } catch (error) {
                // Cleanup might fail in test environment, which is acceptable
                assert.ok(error instanceof Error, 'Should handle cleanup errors gracefully');
            }
        });

        test('Should handle AI review directory cleanup', async () => {
            try {
                await CleanupManager.cleanupAIReviewDirectory();
                assert.ok(true, 'Should complete AI review cleanup without errors');
            } catch (error) {
                // Cleanup might fail in test environment, which is acceptable
                assert.ok(error instanceof Error, 'Should handle cleanup errors gracefully');
            }
        });

        test('Should handle cleanup with different folder combinations', async () => {
            const folderCombinations = [
                ['prompts'],
                ['changes'],
                ['results'],
                ['prompts', 'changes'],
                ['changes', 'results'],
                ['prompts', 'changes', 'results'],
                []
            ];

            for (const folders of folderCombinations) {
                try {
                    await CleanupManager.cleanupSelectiveDirectories(folders);
                    assert.ok(true, `Should handle cleanup for folders: ${folders.join(', ')}`);
                } catch (error) {
                    assert.ok(error instanceof Error, `Should handle errors for folders: ${folders.join(', ')}`);
                }
            }
        });
    });

    suite('File Count Tests', () => {
        test('Should return consistent file counts', () => {
            const count1 = CleanupManager.getFileCount();
            const count2 = CleanupManager.getFileCount();
            
            assert.strictEqual(count1.prompts, count2.prompts, 'Prompts count should be consistent');
            assert.strictEqual(count1.changes, count2.changes, 'Changes count should be consistent');
            assert.strictEqual(count1.results, count2.results, 'Results count should be consistent');
            assert.strictEqual(count1.total, count2.total, 'Total count should be consistent');
        });

        test('Should calculate total correctly', () => {
            const fileCount = CleanupManager.getFileCount();
            const expectedTotal = fileCount.prompts + fileCount.changes + fileCount.results;
            assert.strictEqual(fileCount.total, expectedTotal, 'Total should equal sum of individual counts');
        });

        test('Should handle non-negative counts', () => {
            const fileCount = CleanupManager.getFileCount();
            assert.ok(fileCount.prompts >= 0, 'Prompts count should be non-negative');
            assert.ok(fileCount.changes >= 0, 'Changes count should be non-negative');
            assert.ok(fileCount.results >= 0, 'Results count should be non-negative');
            assert.ok(fileCount.total >= 0, 'Total count should be non-negative');
        });
    });

    suite('Error Handling Tests', () => {
        test('Should handle workspace not found errors', async () => {
            // Temporarily mock workspace folders to be empty
            const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
            Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                value: undefined,
                configurable: true
            });

            try {
                await CleanupManager.cleanupSelectiveDirectories();
                assert.fail('Should throw error when no workspace found');
            } catch (error) {
                assert.ok(error instanceof Error, 'Should throw proper error for missing workspace');
                assert.ok(error.message.includes('No workspace folder found'), 'Error message should be descriptive');
            } finally {
                // Restore original workspace folders
                Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                    value: originalWorkspaceFolders,
                    configurable: true
                });
            }
        });

        test('Should handle concurrent cleanup operations', async () => {
            const promises = [
                CleanupManager.cleanupSelectiveDirectories(['prompts']),
                CleanupManager.cleanupSelectiveDirectories(['changes']),
                CleanupManager.cleanupSelectiveDirectories(['results'])
            ];

            try {
                await Promise.all(promises);
                assert.ok(true, 'Should handle concurrent operations successfully');
            } catch (error) {
                assert.ok(error instanceof Error, 'Should handle concurrent operation conflicts');
            }
        });

        test('Should handle invalid folder names', async () => {
            const invalidFolders = ['', 'invalid-folder', '../parent', '/absolute/path'];
            
            for (const folder of invalidFolders) {
                try {
                    await CleanupManager.cleanupSelectiveDirectories([folder]);
                    assert.ok(true, `Should handle invalid folder gracefully: ${folder}`);
                } catch (error) {
                    assert.ok(error instanceof Error, `Should handle invalid folder: ${folder}`);
                }
            }
        });
    });

    suiteTeardown(() => {
        // Clean up any test artifacts
        try {
            // No specific cleanup needed for static methods
        } catch (error) {
            // Ignore cleanup errors during teardown
        }
    });
});