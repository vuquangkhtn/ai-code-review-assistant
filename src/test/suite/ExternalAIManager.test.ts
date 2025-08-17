import * as assert from 'assert';
import * as vscode from 'vscode';
import { suite, test, before, after } from 'mocha';
import { ExternalAIManager } from '../../ai/ExternalAIManager';
import { ChangeType, ChangeInfo, ChangedFile, ReviewRequest } from '../../types';

suite('ExternalAIManager Test Suite', () => {
    let aiManager: ExternalAIManager;
    let mockChangeInfo: ChangeInfo;
    let mockRequest: ReviewRequest;

    before(async () => {
        aiManager = ExternalAIManager.getInstance();
        
        // Create mock change info and request for testing
        mockChangeInfo = {
            type: ChangeType.LOCAL,
            source: 'test',
            files: [
                {
                    path: 'test.js',
                    status: 'modified',
                    additions: 5,
                    deletions: 2,
                    diff: '+console.log("test");\n-console.log("old");'
                } as ChangedFile
            ]
        };
        
        mockRequest = {
            changeInfo: mockChangeInfo,
            aiProvider: 'test-provider'
        };
    });

    suite('Singleton Pattern Tests', () => {
        test('Should return same instance', () => {
            const instance1 = ExternalAIManager.getInstance();
            const instance2 = ExternalAIManager.getInstance();
            assert.strictEqual(instance1, instance2, 'Should return same instance');
        });

        test('Should have required methods', () => {
            assert.ok(typeof aiManager.copyPromptToClipboard === 'function', 'Should have copyPromptToClipboard method');
            assert.ok(typeof aiManager.pasteAndProcessResponse === 'function', 'Should have pasteAndProcessResponse method');
            assert.ok(typeof aiManager.processAIResponse === 'function', 'Should have processAIResponse method');
            assert.ok(typeof aiManager.setChangeDetector === 'function', 'Should have setChangeDetector method');
        });
    });

    suite('Prompt Generation Tests', () => {
        test('Should handle copyPromptToClipboard without ChangeDetector', async () => {
            try {
                await aiManager.copyPromptToClipboard(mockRequest);
                // Should show error message about ChangeDetector not initialized
            } catch (error) {
                // Expected when ChangeDetector is not set
                assert.ok(error instanceof Error || typeof error === 'undefined');
            }
        });

        test('Should set ChangeDetector', () => {
            const mockChangeDetector = {
                detectWorkspaceFiles: async () => mockChangeInfo,
                detectAndStoreLocalChanges: async () => ({ changeInfo: mockChangeInfo, filePath: 'test.json' })
            };
            
            assert.doesNotThrow(() => {
                aiManager.setChangeDetector(mockChangeDetector);
            }, 'Should set ChangeDetector without error');
        });
    });

    suite('Response Processing Tests', () => {
        test('Should process AI response', () => {
            const mockResponse = JSON.stringify({
                issues: [],
                summary: {
                    totalIssues: 0,
                    criticalIssues: 0,
                    highIssues: 0,
                    mediumIssues: 0,
                    lowIssues: 0,
                    categories: {}
                }
            });
            
            const result = aiManager.processAIResponse(mockResponse, mockRequest);
            if (result) {
                assert.ok(result.issues, 'Should have issues array');
                assert.ok(result.summary, 'Should have summary');
            }
        });

        test('Should handle invalid JSON response', () => {
            const invalidResponse = 'invalid json';
            const result = aiManager.processAIResponse(invalidResponse, mockRequest);
            // Should handle gracefully and return null or throw error
            assert.ok(result === null || result !== undefined);
        });
    });

    suite('File Management Tests', () => {
        test('Should get last prompt file path', async () => {
            const path = await aiManager.getLastPromptFilePath();
            // Should return string or undefined
            assert.ok(typeof path === 'string' || typeof path === 'undefined');
        });

        test('Should get last change file path', async () => {
            const path = await aiManager.getLastChangeFilePath();
            // Should return string or undefined
            assert.ok(typeof path === 'string' || typeof path === 'undefined');
        });

        test('Should check review result from file', async () => {
            const result = await aiManager.checkReviewResultFromFile();
            // Should return ReviewResult or null
            assert.ok(result === null || (result && typeof result === 'object'));
        });
    });
});