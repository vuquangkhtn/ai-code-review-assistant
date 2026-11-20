import { createHash } from 'crypto';
import { PromptGenerator } from '../../ai/PromptGenerator';
import { suite, test } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFileSync } from 'child_process';

suite('CLI review tracer', () => {
    test('manual prompt including its tail matches the pre-feature baseline', () => {
        const result = PromptGenerator.generateFileReferencePrompt('changes.json');
        assert.ok(result.filePath);
        const content = fs.readFileSync(result.filePath, 'utf8')
            .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z/g, '<timestamp>');
        assert.strictEqual(createHash('sha256').update(content).digest('hex'),
            // Baseline intentionally moved in #11: the contract now requests optional
            // confidence and evidence for each finding (manual + CLI sections). Any other
            // drift still fails here.
            '21ddda529b5231e54a22cf86815bdc2ccd3c8f6f8795d817feac55a438270e5a');
        const cli = PromptGenerator.generateFileReferencePrompt('changes.json', 'cli').content
            .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z/g, '<timestamp>');
        assert.ok(cli.startsWith(content.split('**IMPORTANT: File Output Instructions**')[0]));
    });
    for (const selection of ['branch', 'local', 'cancel-base', 'cancel-target']) {
        test(`CLI review uses selected changes: ${selection}`, async function () {
            this.timeout(20000);
            const extension = vscode.extensions.getExtension('vuquangkhtn.ai-code-review-assistant');
            assert.ok(extension);
            await extension.activate();
            const workspace = vscode.workspace.workspaceFolders?.[0];
            const node = process.env.CLI_TEST_NODE;
            assert.ok(workspace && node);
            const cwd = workspace.uri.fsPath;
            const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
            git('add', '.');
            git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '--allow-empty', '-m', 'fixture');
            const originalBranch = git('branch', '--show-current');
            git('branch', '-f', 'review-base');
            git('checkout', '-B', 'review-target');
            fs.writeFileSync(path.join(cwd, 'sample.js'), 'const branchOnly = 18;\n');
            git('add', 'sample.js');
            git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'branch change');
            git('checkout', 'review-base');
            const config = vscode.workspace.getConfiguration('aiCodeReview');
            const previousType = config.inspect<string>('defaultChangeType')?.globalValue;
            const previousCommand = config.inspect<string>('cli.customCommand')?.globalValue;
            const choose = vscode.window.showQuickPick;
            let picks = 0;
            const promptFile = path.join(cwd, 'received-prompt.txt');
            fs.rmSync(promptFile, { force: true });
            // The UI boundary is scripted; the command, git detector and CLI are real.
            Object.defineProperty(vscode.window, 'showQuickPick', { configurable: true, value: async (items: readonly vscode.QuickPickItem[], options: vscode.QuickPickOptions) => {
                picks++;
                assert.match(options.title || '', new RegExp(`Step ${picks}/2`));
                if (picks === 1) {
                    assert.ok(items.some(item => item.label === 'review-base' && item.description === '(current)'));
                    if (selection === 'cancel-base') { return undefined; }
                    return items.find(item => item.label === 'review-base');
                }
                assert.ok(!items.some(item => item.label === 'review-base'));
                return selection === 'cancel-target' ? undefined : items.find(item => item.label === 'review-target');
            }});
            try {
                await config.update('defaultChangeType', selection === 'local' ? 'local' : 'branch', vscode.ConfigurationTarget.Global);
                await config.update('cli.customCommand', `"${node}" "${path.join(extension.extensionPath, 'src/test/fixtures/review.cjs')}"`, vscode.ConfigurationTarget.Global);
                await vscode.commands.executeCommand('aiCodeReview.runCLIReview');
                if (selection.startsWith('cancel')) {
                    assert.ok(!fs.existsSync(promptFile), 'no CLI process starts');
                    assert.strictEqual(git('branch', '--show-current'), 'review-base');
                    assert.strictEqual(picks, selection === 'cancel-base' ? 1 : 2);
                    // A second command must run, proving cancellation released the lock.
                    await config.update('defaultChangeType', 'local', vscode.ConfigurationTarget.Global);
                    await vscode.commands.executeCommand('aiCodeReview.runCLIReview');
                    assert.ok(fs.existsSync(promptFile));
                } else {
                    assert.strictEqual(picks, selection === 'local' ? 0 : 2);
                    const prompt = fs.readFileSync(promptFile, 'utf8');
                    assert.match(prompt, /Respond with a JSON object only/);
                    const changesPath = prompt.match(/Changes File:\*\* `([^`]+)`/);
                    assert.ok(changesPath);
                    const changes = JSON.parse(fs.readFileSync(path.resolve(cwd, changesPath[1]), 'utf8'));
                    assert.strictEqual(changes.type, selection === 'local' ? 'local' : 'branch');
                    if (selection === 'branch') {
                        assert.strictEqual(changes.source, 'review-base');
                        assert.strictEqual(changes.target, 'review-target');
                        assert.ok(JSON.stringify(changes).includes('sample.js'));
                        assert.strictEqual(git('branch', '--show-current'), 'review-target');
                    }
                }
            } finally {
                vscode.window.showQuickPick = choose;
                await config.update('defaultChangeType', previousType, vscode.ConfigurationTarget.Global);
                await config.update('cli.customCommand', previousCommand, vscode.ConfigurationTarget.Global);
                git('checkout', originalBranch);
            }
        });
    }
    for (const mode of ['clean', 'noisy', 'preset']) {
        test(`palette command delivers stdin and displays ${mode} results via watcher`, async function () {
            this.timeout(20000);
            if (mode === 'preset' && process.platform === 'win32') { this.skip(); }
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
            const previousPATH = process.env.PATH;
            const bin = mode === 'preset' ? fs.mkdtempSync(path.join(os.tmpdir(), 'cli-path-')) : undefined;
            if (bin) {
                const git = execFileSync('/usr/bin/which', ['git'], { encoding: 'utf8' }).trim();
                fs.symlinkSync(git, path.join(bin, 'git'));
                fs.writeFileSync(path.join(bin, 'codex'), `#!${node}\nrequire(${JSON.stringify(fixture)});`, { mode: 0o755 });
                process.env.PATH = bin;
            }
            await config.update('cli.customCommand', bin ? '' : command, vscode.ConfigurationTarget.Global);
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
                process.env.PATH = previousPATH;
                if (bin) { fs.rmSync(bin, { recursive: true, force: true }); }
                await config.update('cli.customCommand', previousCommand, vscode.ConfigurationTarget.Global);
            }
        });
    }
});
