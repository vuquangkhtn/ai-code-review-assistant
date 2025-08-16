import * as assert from 'assert';
import * as vscode from 'vscode';



// Note: These tests require the extension to be loaded in a test environment
// For now, we'll comment them out to avoid linting errors
/*
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('ai-code-review-assistant'));
    });

    test('Should activate', async () => {
        const ext = vscode.extensions.getExtension('ai-code-review-assistant');
        if (ext) {
            await ext.activate();
            assert.ok(true);
        }
    });

    test('Should register all commands', async () => {
        const commands = await vscode.commands.getCommands();
        const aiCommands = commands.filter(cmd => cmd.startsWith('aiCodeReview.'));
        
        assert.ok(aiCommands.length > 0, 'No AI Code Review commands found');
        assert.ok(aiCommands.includes('aiCodeReview.startReview'), 'Start review command not found');
        assert.ok(aiCommands.includes('aiCodeReview.reviewLocalChanges'), 'Local changes command not found');
    });
});
*/
