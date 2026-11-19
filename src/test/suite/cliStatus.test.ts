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
    for (const ending of ['finish', 'cancel', 'fail']) {
        test(`single-run lock refuses generation and releases after ${ending}`, async function () {
            this.timeout(30000);
            const extension = vscode.extensions.getExtension('vuquangkhtn.ai-code-review-assistant');
            assert.ok(extension);
            await extension.activate();
            const workspace = vscode.workspace.workspaceFolders?.[0];
            const node = process.env.CLI_TEST_NODE;
            assert.ok(workspace && node);
            const config = vscode.workspace.getConfiguration('aiCodeReview');
            const previous = config.inspect<string>('cli.customCommand')?.globalValue;
            const fixture = path.join(workspace.uri.fsPath, 'lock-review.cjs');
            const marker = path.join(workspace.uri.fsPath, 'lock-started.txt');
            const release = path.join(workspace.uri.fsPath, 'lock-release.txt');
            const received = path.join(workspace.uri.fsPath, 'received-prompt.txt');
            fs.rmSync(received, { force: true });
            fs.writeFileSync(fixture, `const fs = require('fs');
                let prompt = '';
                process.stdin.on('data', chunk => prompt += chunk);
                process.stdin.on('end', () => {
                    fs.writeFileSync(${JSON.stringify(marker)}, prompt);
                    const timer = setInterval(() => {
                        if (!fs.existsSync(${JSON.stringify(release)})) return;
                        clearInterval(timer);
                        if (${JSON.stringify(ending)} === 'fail') process.exit(7);
                        console.log(JSON.stringify({ issues: [] }));
                    }, 50);
                });`);
            await config.update('cli.customCommand', `"${node}" "${fixture}"`, vscode.ConfigurationTarget.Global);
            const messages: string[] = [];
            const originalWarning = vscode.window.showWarningMessage;
            vscode.window.showWarningMessage = (message: string) => {
                messages.push(message);
                return Promise.resolve(undefined);
            };
            const running = Promise.resolve(vscode.commands.executeCommand('aiCodeReview.runCLIReview'));
            // Attach immediately so the intentional failure cannot become unhandled.
            const outcome = running.then(() => undefined, error => error);
            try {
                const deadline = Date.now() + 10000;
                while (!fs.existsSync(marker) && Date.now() < deadline) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                assert.ok(fs.existsSync(marker), 'slow fixture has received its prompt');
                const prompt = fs.readFileSync(marker, 'utf8');
                const changes = prompt.match(/Changes File:\*\* `([^`]+)`/);
                assert.ok(changes);
                const contents = fs.readFileSync(changes[1], 'utf8');
                for (const command of ['runCLIReview', 'copyPromptLocalChanges', 'copyPromptAllFiles',
                    'copyPromptCompareBranches', 'copyPrompt']) {
                    await vscode.commands.executeCommand(`aiCodeReview.${command}`);
                    assert.match(messages.pop() || '', /CLI review is running.*cancel it first/i, command);
                    assert.strictEqual(fs.readFileSync(changes[1], 'utf8'), contents, 'changes file survives refusal');
                }
                if (ending === 'cancel') {
                    await vscode.commands.executeCommand('aiCodeReview.cancelCLIReview');
                } else {
                    fs.writeFileSync(release, 'release');
                }
                const error = await outcome;
                if (ending === 'fail') { assert.match(String(error), /exit 7/); }
                else { assert.strictEqual(error, undefined); }
                await vscode.commands.executeCommand('aiCodeReview.copyPromptLocalChanges');
                assert.strictEqual(messages.length, 0, 'copy-paste generation works again');
                assert.match(await vscode.env.clipboard.readText(), /Changes File/);
                await config.update('cli.customCommand', `"${node}" "${path.join(extension.extensionPath,
                    'src/test/fixtures/review.cjs')}" clean`, vscode.ConfigurationTarget.Global);
                await vscode.commands.executeCommand('aiCodeReview.runCLIReview');
                assert.ok(fs.existsSync(received), 'CLI generation works again');
            } finally {
                await vscode.commands.executeCommand('aiCodeReview.cancelCLIReview');
                await outcome;
                vscode.window.showWarningMessage = originalWarning;
                await config.update('cli.customCommand', previous, vscode.ConfigurationTarget.Global);
                for (const file of [fixture, marker, release]) { fs.rmSync(file, { force: true }); }
            }
        });
    }

});
