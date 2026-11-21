import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { suite, test } from 'mocha';
import { CodeReviewTreeProvider } from '../../ui/CodeReviewTreeProvider';
import { CLIReviewStatus } from '../../types';

// Capture the extension's registered CLI Review tree provider so the recovery tests can
// read the row status the run command leaves behind. Test modules are all loaded before
// the first test executes, so this wrapper is installed before any test activates the
// extension. It only records the first registration; registration behavior is unchanged.
const cliTree: { provider?: CodeReviewTreeProvider } = {};
const originalRegisterTree = vscode.window.registerTreeDataProvider.bind(vscode.window);
(vscode.window as any).registerTreeDataProvider = (viewId: string, provider: any) => {
    if (viewId === 'aiCodeReviewPanel' && !cliTree.provider) { cliTree.provider = provider; }
    return originalRegisterTree(viewId, provider);
};

// The recovery suite is declared first: mocha runs suites in declaration order, and the
// `single-run lock ... after fail` test below leaves a hung run behind on current VS Code
// test hosts (its failure dialog is never dismissed), which would refuse every later run
// command via the single-run lock. Recovery scenarios need a clean run state.
suite('CLI review failure recovery (issue #38)', () => {
    const assertTerminalRow = async (tree: CodeReviewTreeProvider, expectedIcon: string) => {
        const row = (await tree.getChildren())[0];
        assert.notStrictEqual(row.contextValue, 'cliReviewRunning', 'row must not stay running');
        assert.strictEqual(row.command?.command, 'aiCodeReview.runCLIReview', 'row must offer re-run');
        assert.strictEqual((row.iconPath as vscode.ThemeIcon).id, expectedIcon);
        return row;
    };

    const activateWithWorkspace = async () => {
        const extension = vscode.extensions.getExtension('vuquangkhtn.ai-code-review-assistant');
        assert.ok(extension);
        await extension.activate();
        const workspace = vscode.workspace.workspaceFolders?.[0];
        const node = process.env.CLI_TEST_NODE;
        assert.ok(workspace && node);
        const tree = cliTree.provider;
        assert.ok(tree, 'extension CLI Review tree provider was captured');
        return { workspace, node, tree };
    };

    // Records every warning so tests can prove the run command was not refused by the
    // single-run lock (a leftover active run would emit "A CLI review is running...").
    const captureWarnings = () => {
        const messages: string[] = [];
        const original = vscode.window.showWarningMessage;
        vscode.window.showWarningMessage = (message: string) => {
            messages.push(message);
            return Promise.resolve(/Stop the running review/.test(message) ? 'Stop' : undefined);
        };
        return { messages, restore: () => { vscode.window.showWarningMessage = original; } };
    };

    test('provider not on PATH: dialog offers switching, routes to the switcher, row settles', async function () {
        this.timeout(30000);
        const { node, tree } = await activateWithWorkspace();
        const warnings = captureWarnings();
        const config = vscode.workspace.getConfiguration('aiCodeReview');
        const previousCommand = config.inspect<string>('cli.customCommand')?.globalValue;
        const previousProvider = config.inspect<string>('cli.defaultProvider')?.globalValue;
        const previousPATH = process.env.PATH;
        const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-recovery-'));
        // One other provider is detected, so recovery can offer switching to it.
        fs.writeFileSync(path.join(bin, 'claude'), `#!${node}\nprocess.exit(1);`, { mode: 0o755 });
        process.env.PATH = bin;
        const dialogs: { message: string; actions: string[] }[] = [];
        const originalError = vscode.window.showErrorMessage;
        const originalPick = vscode.window.showQuickPick;
        (vscode.window as any).showErrorMessage = async (message: string, ...actions: string[]) => {
            dialogs.push({ message, actions });
            return 'Switch CLI Provider';
        };
        let switcher: { placeholder?: string; items: string[] } | undefined;
        Object.defineProperty(vscode.window, 'showQuickPick', { configurable: true, value: async (items: readonly vscode.QuickPickItem[], options: vscode.QuickPickOptions) => {
            switcher = { placeholder: options?.placeHolder, items: items.map(item => (item as any).id ?? item.label) };
            return undefined;
        }});
        try {
            await config.update('cli.customCommand', '', vscode.ConfigurationTarget.Global);
            await config.update('cli.defaultProvider', 'zcode', vscode.ConfigurationTarget.Global);
            const outcome = await vscode.commands.executeCommand('aiCodeReview.runCLIReview')
                .then(() => undefined, (error: unknown) => error);
            assert.deepStrictEqual(warnings.messages, [], 'no leftover run refused the command');
            assert.match(String(outcome), /zcode CLI was not found on PATH/, 'provider-not-found rejects the run');
            assert.strictEqual(dialogs.length, 1, 'failure dialog was shown once');
            assert.ok(dialogs[0].actions.includes('Switch CLI Provider'),
                `dialog should offer switching, got: ${dialogs[0].actions.join(', ')}`);
            assert.strictEqual(switcher?.placeholder, 'Select the CLI provider for AI reviews',
                'switch action routes to the aiCodeReview.selectCLIProvider quickpick');
            assert.ok(switcher?.items.includes('claude'), 'switcher lists the detected alternative');
            const row = await assertTerminalRow(tree, 'error');
            assert.match(String(row.tooltip), /zcode CLI was not found on PATH/, 'row carries the failure message');
        } finally {
            warnings.restore();
            (vscode.window as any).showErrorMessage = originalError;
            Object.defineProperty(vscode.window, 'showQuickPick', { configurable: true, value: originalPick });
            process.env.PATH = previousPATH;
            fs.rmSync(bin, { recursive: true, force: true });
            await config.update('cli.customCommand', previousCommand, vscode.ConfigurationTarget.Global);
            await config.update('cli.defaultProvider', previousProvider, vscode.ConfigurationTarget.Global);
        }
    });

    test('no CLI on PATH: dialog offers opening settings, row settles', async function () {
        this.timeout(30000);
        const { tree } = await activateWithWorkspace();
        const warnings = captureWarnings();
        const config = vscode.workspace.getConfiguration('aiCodeReview');
        const previousCommand = config.inspect<string>('cli.customCommand')?.globalValue;
        const previousProvider = config.inspect<string>('cli.defaultProvider')?.globalValue;
        const previousPATH = process.env.PATH;
        const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-empty-'));
        process.env.PATH = bin;
        const dialogs: { message: string; actions: string[] }[] = [];
        const originalError = vscode.window.showErrorMessage;
        (vscode.window as any).showErrorMessage = async (message: string, ...actions: string[]) => {
            dialogs.push({ message, actions });
            return undefined;
        };
        try {
            await config.update('cli.customCommand', '', vscode.ConfigurationTarget.Global);
            await config.update('cli.defaultProvider', 'zcode', vscode.ConfigurationTarget.Global);
            const outcome = await vscode.commands.executeCommand('aiCodeReview.runCLIReview')
                .then(() => undefined, (error: unknown) => error);
            assert.deepStrictEqual(warnings.messages, [], 'no leftover run refused the command');
            assert.match(String(outcome), /No supported CLI found on PATH/, 'no-CLI failure rejects the run');
            assert.deepStrictEqual(dialogs[0]?.actions, ['Show Output', 'Open Settings'],
                'without alternatives the dialog offers opening the cli settings');
            await assertTerminalRow(tree, 'error');
        } finally {
            warnings.restore();
            (vscode.window as any).showErrorMessage = originalError;
            process.env.PATH = previousPATH;
            fs.rmSync(bin, { recursive: true, force: true });
            await config.update('cli.customCommand', previousCommand, vscode.ConfigurationTarget.Global);
            await config.update('cli.defaultProvider', previousProvider, vscode.ConfigurationTarget.Global);
        }
    });

    test('cancelCLIReview heals a stale running row; live runs still confirm before stopping', async function () {
        this.timeout(30000);
        const { workspace, node, tree } = await activateWithWorkspace();
        const warnings = captureWarnings();
        const config = vscode.workspace.getConfiguration('aiCodeReview');
        const previousCommand = config.inspect<string>('cli.customCommand')?.globalValue;
        const fixture = path.join(workspace.uri.fsPath, 'heal-review.cjs');
        const marker = path.join(workspace.uri.fsPath, 'heal-started.txt');
        let running: Promise<unknown> | undefined;
        try {
            // Stale render: the row claims running while no run is active.
            tree.setCLIStatus({ kind: 'running' });
            await vscode.commands.executeCommand('aiCodeReview.cancelCLIReview');
            assert.deepStrictEqual(warnings.messages, [], 'no stop confirmation for a stale row');
            await assertTerminalRow(tree, 'play');

            // A live run keeps confirm-to-stop and ends idle after the abort.
            fs.writeFileSync(fixture, `require('fs').writeFileSync(${JSON.stringify(marker)}, String(process.pid));
                process.stdin.resume(); setTimeout(() => {}, 30000);`);
            await config.update('cli.customCommand', `"${node}" "${fixture}"`, vscode.ConfigurationTarget.Global);
            running = Promise.resolve(vscode.commands.executeCommand('aiCodeReview.runCLIReview'));
            const outcome = running.then(() => undefined, (error: unknown) => error);
            const deadline = Date.now() + 10000;
            while (!fs.existsSync(marker) && Date.now() < deadline) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            assert.ok(fs.existsSync(marker), 'fixture started');
            await vscode.commands.executeCommand('aiCodeReview.cancelCLIReview');
            assert.ok(warnings.messages.some(message => /Stop the running review/.test(message)),
                'live run asks for confirmation');
            await outcome;
            await assertTerminalRow(tree, 'play');
        } finally {
            warnings.restore();
            if (running) {
                await vscode.commands.executeCommand('aiCodeReview.cancelCLIReview');
                await running.catch(() => undefined);
            }
            await config.update('cli.customCommand', previousCommand, vscode.ConfigurationTarget.Global);
            fs.rmSync(fixture, { force: true });
            fs.rmSync(marker, { force: true });
        }
    });

    test('row settles even when the failure render itself fails (terminal-status guard)', async function () {
        this.timeout(30000);
        const { node, tree } = await activateWithWorkspace();
        const warnings = captureWarnings();
        const config = vscode.workspace.getConfiguration('aiCodeReview');
        const previousCommand = config.inspect<string>('cli.customCommand')?.globalValue;
        const previousProvider = config.inspect<string>('cli.defaultProvider')?.globalValue;
        const previousPATH = process.env.PATH;
        const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-guard-'));
        fs.writeFileSync(path.join(bin, 'claude'), `#!${node}\nprocess.exit(1);`, { mode: 0o755 });
        process.env.PATH = bin;
        // Break only the `failed` render: the run command must still force a terminal row.
        const originalSetCLIStatus = tree.setCLIStatus.bind(tree);
        let failedRenders = 0;
        (tree as any).setCLIStatus = (status: CLIReviewStatus) => {
            if (status.kind === 'failed') { failedRenders++; throw new Error('row render exploded'); }
            return originalSetCLIStatus(status);
        };
        try {
            await config.update('cli.customCommand', '', vscode.ConfigurationTarget.Global);
            await config.update('cli.defaultProvider', 'zcode', vscode.ConfigurationTarget.Global);
            const outcome = await vscode.commands.executeCommand('aiCodeReview.runCLIReview')
                .then(() => undefined, (error: unknown) => error);
            assert.deepStrictEqual(warnings.messages, [], 'no leftover run refused the command');
            assert.match(String(outcome), /row render exploded/, 'the render failure surfaces');
            assert.strictEqual(failedRenders, 1, 'the failed render was attempted once');
            await assertTerminalRow(tree, 'play');
        } finally {
            warnings.restore();
            (tree as any).setCLIStatus = originalSetCLIStatus;
            process.env.PATH = previousPATH;
            fs.rmSync(bin, { recursive: true, force: true });
            await config.update('cli.customCommand', previousCommand, vscode.ConfigurationTarget.Global);
            await config.update('cli.defaultProvider', previousProvider, vscode.ConfigurationTarget.Global);
        }
    });

});

suite('CLI review status', () => {
    test('one CLI Review row reflects the run: order, renames, no separate status row', async () => {
        const tree = new CodeReviewTreeProvider();
        const rows = await tree.getChildren();
        assert.deepStrictEqual(rows.map(item => item.label), ['CLI Review', 'Manual Review', 'Review Type']);
        const run = rows[0];
        assert.strictEqual(run.command?.command, 'aiCodeReview.runCLIReview');
        assert.strictEqual((run.iconPath as vscode.ThemeIcon).id, 'play');
        tree.setCLIStatus({ kind: 'running', progress: { reviewed: 3, total: 10 } });
        const running = (await tree.getChildren())[0];
        assert.strictEqual(running.command?.command, 'aiCodeReview.cancelCLIReview');
        assert.strictEqual(running.contextValue, 'cliReviewRunning');
        assert.strictEqual((running.iconPath as vscode.ThemeIcon).id, 'loading~spin');
        assert.strictEqual(running.description, '3/10 files');
        tree.setCLIStatus({ kind: 'done' });
        assert.strictEqual(((await tree.getChildren())[0].iconPath as vscode.ThemeIcon).id, 'check');
        tree.setCLIStatus({ kind: 'failed', message: 'fixture stderr tail' });
        const failed = (await tree.getChildren())[0];
        assert.strictEqual(failed.description, 'fixture stderr tail');
        assert.strictEqual(failed.tooltip, 'fixture stderr tail');
        assert.strictEqual(failed.command?.command, 'aiCodeReview.runCLIReview');
        tree.setCLIStatus({ kind: 'idle' });
        assert.deepStrictEqual((await tree.getChildren()).map(item => item.label),
            ['CLI Review', 'Manual Review', 'Review Type']);
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
        // The cancel command confirms before aborting; auto-consent for this test.
        const originalCancelWarning = vscode.window.showWarningMessage;
        vscode.window.showWarningMessage = async (message: string) => {
            assert.match(message, /Stop the running review/);
            return 'Stop';
        };
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
            vscode.window.showWarningMessage = originalCancelWarning;
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
                if (/Stop the running review/.test(message)) { return Promise.resolve('Stop'); }
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
                const changesPath = path.join(workspace.uri.fsPath, changes[1]);
                const contents = fs.readFileSync(changesPath, 'utf8');
                for (const command of ['runCLIReview', 'copyPromptLocalChanges', 'copyPromptAllFiles',
                    'copyPromptCompareBranches', 'copyPrompt']) {
                    await vscode.commands.executeCommand(`aiCodeReview.${command}`);
                    assert.match(messages.pop() || '', /CLI review is running.*cancel it first/i, command);
                    assert.strictEqual(fs.readFileSync(changesPath, 'utf8'), contents, 'changes file survives refusal');
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
                // Copy-paste generation works again: with changed files present the prompt is
                // file-based (PromptGenerator line ~186) and the clipboard carries its notice.
                const clipboard = await vscode.env.clipboard.readText();
                const saved = clipboard.match(/File location: (\S+)/);
                if (saved) {
                    assert.match(fs.readFileSync(path.join(workspace.uri.fsPath, saved[1]), 'utf8'), /Changes File/);
                } else {
                    assert.match(clipboard, /Changes File/);
                }
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
