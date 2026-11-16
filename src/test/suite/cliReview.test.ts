import { suite, test } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

suite('CLI review tracer', () => {
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
                const sample = vscode.Uri.joinPath(workspace.uri, 'sample.js');
                await vscode.window.showTextDocument(sample);
                const deadline = Date.now() + 10000;
                let displayed = false;
                while (Date.now() < deadline && !displayed) {
                    const lenses = await vscode.commands.executeCommand<vscode.CodeLens[]>('vscode.executeCodeLensProvider', sample);
                    displayed = !!lenses?.some(lens => lens.command?.command === 'aiCodeReview.markIssueResolved');
                    if (!displayed) { await new Promise(resolve => setTimeout(resolve, 100)); }
                }
                assert.ok(displayed, 'watcher propagated result to review UI');
                assert.ok(vscode.window.tabGroups.all.flatMap(group => group.tabs).some(tab => tab.label === 'AI Code Review'));
            } finally {
                await config.update('cli.customCommand', undefined, vscode.ConfigurationTarget.Global);
            }
        });
    }
});
