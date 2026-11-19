import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { suite, test } from 'mocha';
import { CodeReviewTreeProvider } from '../../ui/CodeReviewTreeProvider';

suite('CLI review status', () => {
    test('tree offers a run, cancellation while running and failure details', async () => {
        const tree = new CodeReviewTreeProvider();
        const run = (await tree.getChildren()).find(item => item.label === 'Run Review with CLI');
        assert.strictEqual(run?.command?.command, 'aiCodeReview.runCLIReview');
        tree.setCLIStatus({ kind: 'running' });
        const running = (await tree.getChildren()).find(item => item.contextValue === 'cliReviewRunning');
        assert.strictEqual(running?.command?.command, 'aiCodeReview.cancelCLIReview');
        tree.setCLIStatus({ kind: 'done' });
        assert.ok((await tree.getChildren()).some(item => item.label === 'CLI review: done'));
        tree.setCLIStatus({ kind: 'failed', message: 'fixture stderr tail' });
        const failed = (await tree.getChildren()).find(item => item.label === 'CLI review: failed');
        assert.strictEqual(failed?.tooltip, 'fixture stderr tail');
        assert.strictEqual(failed?.command?.command, 'aiCodeReview.showCLIOutput');
        tree.setCLIStatus({ kind: 'idle' });
        assert.ok(!(await tree.getChildren()).some(item => item.contextValue?.startsWith('cliReview')));
    });

    test('custom command can be cancelled from the registered tree command', async function () {
        this.timeout(15000);
        const extension = vscode.extensions.getExtension('vuquangkhtn.ai-code-review-assistant');
        assert.ok(extension);
        await extension.activate();
        const workspace = vscode.workspace.workspaceFolders?.[0];
        const node = process.env.CLI_TEST_NODE;
        assert.ok(workspace && node);
        const config = vscode.workspace.getConfiguration('aiCodeReview');
        const previous = config.inspect<string>('cli.customCommand')?.globalValue;
        const fixture = path.join(workspace.uri.fsPath, 'slow-review.cjs');
        const marker = path.join(workspace.uri.fsPath, 'slow-pid.txt');
        fs.writeFileSync(fixture, `require('fs').writeFileSync(${JSON.stringify(marker)}, String(process.pid));
            process.stdin.resume(); console.log('review is alive'); setTimeout(() => {}, 30000);`);
        await config.update('cli.customCommand', `"${node}" "${fixture}"`, vscode.ConfigurationTarget.Global);
        const results = path.join(workspace.uri.fsPath, '.ai-code-review/results');
        const before = fs.existsSync(results) ? fs.readdirSync(results).sort() : [];
        const running = vscode.commands.executeCommand('aiCodeReview.runCLIReview');
        try {
            const deadline = Date.now() + 10000;
            while (!fs.existsSync(marker) && Date.now() < deadline) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            assert.ok(fs.existsSync(marker), 'custom command started without a preset');
            await vscode.commands.executeCommand('aiCodeReview.cancelCLIReview');
            await running;
            assert.deepStrictEqual(fs.existsSync(results) ? fs.readdirSync(results).sort() : [], before);
        } finally {
            await vscode.commands.executeCommand('aiCodeReview.cancelCLIReview');
            await running;
            await config.update('cli.customCommand', previous, vscode.ConfigurationTarget.Global);
            fs.rmSync(fixture, { force: true });
            fs.rmSync(marker, { force: true });
        }
    });
});
