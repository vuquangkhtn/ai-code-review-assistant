import { createHash } from 'crypto';
import { PromptGenerator } from '../../ai/PromptGenerator';
import { suite, test } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

suite('CLI review tracer', () => {
    test('manual prompt including its tail matches the pre-feature baseline', () => {
        const result = PromptGenerator.generateFileReferencePrompt('changes.json');
        assert.ok(result.filePath);
        const content = fs.readFileSync(result.filePath, 'utf8')
            .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z/g, '<timestamp>');
        assert.strictEqual(createHash('sha256').update(content).digest('hex'),
            'ca1c1da95e965f9150adca27c6df171efc4095f880771c6f4ef56a27210c631b');
        const cli = PromptGenerator.generateFileReferencePrompt('changes.json', 'cli').content
            .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z/g, '<timestamp>');
        assert.ok(cli.startsWith(content.split('**IMPORTANT: File Output Instructions**')[0]));
    });
    for (const mode of ['clean', 'noisy']) {
        test(`palette command delivers stdin and displays ${mode} results via watcher`, async function () {
            this.timeout(20000);
            const extension = vscode.extensions.getExtension('vuquangkhtn.ai-code-review-assistant');
            assert.ok(extension);
            await extension.activate();
            const workspace = vscode.workspace.workspaceFolders?.[0];
            assert.ok(workspace);
            const config = vscode.workspace.getConfiguration('aiCodeReview');
            const fixture = path.join(extension.extensionPath, 'src/test/fixtures/review.cjs');
            const node = process.env.CLI_TEST_NODE;
            assert.ok(node, 'runner supplies Node executable');
            const previousCommand = config.inspect<string>('cli.customCommand')?.globalValue;
            const sample = vscode.Uri.joinPath(workspace.uri, 'sample.js');
            await vscode.window.showTextDocument(sample);
            const previousLenses = await vscode.commands.executeCommand<vscode.CodeLens[]>('vscode.executeCodeLensProvider', sample);
            const previousIds = new Set(previousLenses?.map(lens => lens.command?.arguments?.[1]));
            const clipboard = await vscode.env.clipboard.readText();
            const command = `"${node}" "${fixture}" ${mode}`;
            await config.update('cli.customCommand', command, vscode.ConfigurationTarget.Global);
            try {
                await vscode.commands.executeCommand('aiCodeReview.runCLIReview');
                const resultsDir = path.join(workspace.uri.fsPath, '.ai-code-review/results');
                const results = fs.readdirSync(resultsDir).filter(name => name.endsWith('.json'));
                assert.ok(results.length > 0, 'command writes review JSON');
                const result = JSON.parse(fs.readFileSync(path.join(resultsDir, results.sort().pop()!), 'utf8'));
                assert.strictEqual(result.issues[0].title, 'Fixture CLI issue');
                assert.match(fs.readFileSync(path.join(workspace.uri.fsPath, 'received-prompt.txt'), 'utf8'), /Respond with a JSON object only/);
                assert.strictEqual(await vscode.env.clipboard.readText(), clipboard);
                const deadline = Date.now() + 10000;
                let displayed = false;
                while (Date.now() < deadline && !displayed) {
                    const lenses = await vscode.commands.executeCommand<vscode.CodeLens[]>('vscode.executeCodeLensProvider', sample);
                    displayed = !!lenses?.some(lens => lens.command?.command === 'aiCodeReview.markIssueResolved' && !previousIds.has(lens.command.arguments?.[1]));
                    if (!displayed) { await new Promise(resolve => setTimeout(resolve, 100)); }
                }
                assert.ok(displayed, 'watcher propagated result to review UI');
                assert.ok(vscode.window.tabGroups.all.flatMap(group => group.tabs).some(tab => tab.label === 'AI Code Review'));
            } finally {
                await config.update('cli.customCommand', previousCommand, vscode.ConfigurationTarget.Global);
            }
        });
    }
});
