const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const Module = require('node:module');

function loadTreeProvider() {
    const vscode = {
        workspace: { getConfiguration: () => ({ get: (key, fallback) => fallback }) },
        EventEmitter: class { fire() {} dispose() {} },
        TreeItem: class { constructor(label) { this.label = label; } },
        TreeItemCollapsibleState: { None: 0, Expanded: 2 }, ThemeIcon: class { constructor(id) { this.id = id; } }
    };
    const originalLoad = Module._load;
    Module._load = function (id, ...args) { return id === 'vscode' ? vscode : originalLoad.call(this, id, ...args); };
    try {
        const { CodeReviewTreeProvider } = require('../../../out/ui/CodeReviewTreeProvider');
        return CodeReviewTreeProvider;
    } finally { Module._load = originalLoad; }
}

test('tree rows: renames, order and pruned duplicate rows', async () => {
    const CodeReviewTreeProvider = loadTreeProvider();
    const tree = new CodeReviewTreeProvider();
    const rows = await tree.getChildren();
    assert.deepEqual(rows.map(row => row.label), ['CLI Review', 'Manual Review', 'Review Type']);
    assert.equal(rows[0].command.command, 'aiCodeReview.runCLIReview');
    assert.equal(rows[1].command.command, 'aiCodeReview.copyPrompt');
    assert.equal(rows[2].contextValue, 'defaultChangeTypeGroup');
    assert.ok(!rows.some(row => /Workflow Guide|Paste Prompt|Generate AI Prompt/.test(row.label)),
        'guide, paste and old prompt rows must leave the tree');
    const options = await tree.getChildren(rows[2]);
    assert.deepEqual(options.map(row => row.label), ['Local Changes', 'Compare Branches']);
});

test('CLI Review row transitions: idle → running with progress → done/failed → idle', async () => {
    const CodeReviewTreeProvider = loadTreeProvider();
    const tree = new CodeReviewTreeProvider();
    const row = async () => (await tree.getChildren())[0];

    const idle = await row();
    assert.equal(idle.iconPath.id, 'play');
    assert.equal(idle.command.command, 'aiCodeReview.runCLIReview');
    assert.equal(idle.contextValue, 'cliReviewAction');

    tree.setCLIStatus({ kind: 'running' });
    const spinning = await row();
    assert.equal(spinning.iconPath.id, 'loading~spin');
    assert.equal(spinning.command.command, 'aiCodeReview.cancelCLIReview');
    assert.equal(spinning.contextValue, 'cliReviewRunning');
    assert.ok(/Running|files/.test(spinning.description), 'running description shows state or progress');
    tree.setCLIStatus({ kind: 'running', progress: { reviewed: 3, total: 10 } });
    assert.equal(await row().then(item => item.description), '3/10 files');

    tree.setCLIStatus({ kind: 'done' });
    assert.equal((await row()).iconPath.id, 'check');
    assert.equal((await row()).command.command, 'aiCodeReview.runCLIReview');
    assert.equal((await row()).contextValue, 'cliReviewAction');

    tree.setCLIStatus({ kind: 'failed', message: 'exit 7: fixture failure' });
    const failed = await row();
    assert.equal(failed.iconPath.id, 'error');
    assert.equal(failed.description, 'exit 7: fixture failure');
    assert.equal(failed.command.command, 'aiCodeReview.runCLIReview');

    tree.setCLIStatus({ kind: 'idle' });
    assert.equal((await row()).iconPath.id, 'play');
    assert.equal((await row()).command.command, 'aiCodeReview.runCLIReview');
});

test('no status row is ever added next to the CLI Review row', async () => {
    const CodeReviewTreeProvider = loadTreeProvider();
    const tree = new CodeReviewTreeProvider();
    for (const status of [{ kind: 'running', progress: { reviewed: 1, total: 2 } }, { kind: 'done' },
        { kind: 'failed', message: 'boom' }]) {
        tree.setCLIStatus(status);
        const rows = await tree.getChildren();
        assert.deepEqual(rows.map(row => row.label), ['CLI Review', 'Manual Review', 'Review Type']);
        assert.ok(!rows.some(row => row.label.startsWith('CLI review:')));
    }
});

test('manifest: removed actions stay palette commands; inline stop menu is gone; titles follow renames', () => {
    const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf8'));
    const commands = manifest.contributes.commands.map(entry => entry.command);
    for (const id of ['aiCodeReview.openWorkflowGuide', 'aiCodeReview.pastePrompt']) {
        assert.ok(commands.includes(id), `${id} must remain invocable from the Command Palette`);
    }
    const inline = manifest.contributes.menus['view/item/context'] || [];
    assert.ok(!inline.some(entry => entry.command === 'aiCodeReview.cancelCLIReview'),
        'the inline stop menu entry must be removed');
    const title = id => manifest.contributes.commands.find(entry => entry.command === id)?.title;
    assert.equal(title('aiCodeReview.runCLIReview'), 'CLI Review');
    assert.equal(title('aiCodeReview.copyPrompt'), 'Manual Review');
});

test('cancel asks for confirmation; dispose still aborts without a dialog', { timeout: 15000 }, async () => {
    const handlers = new Map();
    const disposable = { dispose() {} };
    const noop = () => disposable;
    const ui = new Proxy({}, { get: () => noop });
    let cwd, warnings = [], confirmStop;
    const config = { get(key, fallback) {
        if (key === 'cli.customCommand') return `"${process.execPath}" "${path.join(cwd, 'sleepy.cjs')}"`;
        return fallback;
    } };
    const vscode = {
        workspace: { get workspaceFolders() { return [{ uri: { fsPath: cwd } }]; }, isTrusted: true,
            getConfiguration: () => config, onDidChangeConfiguration: noop,
            createFileSystemWatcher: () => ui },
        window: { registerTreeDataProvider: noop, createOutputChannel: () => ui,
            createTextEditorDecorationType: () => disposable, onDidChangeActiveTextEditor: noop,
            showInformationMessage: noop,
            showWarningMessage: async (message) => { warnings.push(message); return confirmStop ? 'Stop' : undefined; },
            showErrorMessage: noop, showQuickPick: noop },
        commands: { registerCommand: (name, fn) => { handlers.set(name, fn); return disposable; }, executeCommand: noop },
        languages: { createDiagnosticCollection: () => ui, registerCodeLensProvider: noop },
        EventEmitter: class { fire() {} dispose() {} }, TreeItem: class {}, ThemeColor: class {}, ThemeIcon: class {},
        TreeItemCollapsibleState: { None: 0, Collapsed: 1 }, OverviewRulerLane: { Right: 4 },
        Uri: { file: fsPath => ({ fsPath }) }, RelativePattern: class {}, Range: class {}
    };
    const originalLoad = Module._load;
    Module._load = function (id, ...args) { return id === 'vscode' ? vscode : originalLoad.call(this, id, ...args); };
    const { activate } = require('../../../out/extension');
    const { CodeReviewTreeProvider } = require('../../../out/ui/CodeReviewTreeProvider');
    let status;
    const setStatus = CodeReviewTreeProvider.prototype.setCLIStatus;
    CodeReviewTreeProvider.prototype.setCLIStatus = function (value) { status = value; setStatus.call(this, value); };
    Module._load = originalLoad;

    const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-tree-'));
    const subscriptions = [];
    const pids = [];
    activate({ subscriptions, globalState: { get() {}, update: async () => {} } });
    try {
        git('init', '-b', 'main');
        git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.com');
        fs.writeFileSync(path.join(cwd, 'sample.js'), 'let sample = 1;\n');
        git('add', '.'); git('commit', '-m', 'base');
        const marker = path.join(cwd, 'sleepy-pid.txt');
        fs.writeFileSync(path.join(cwd, 'sleepy.cjs'), `require('fs').writeFileSync(${JSON.stringify(marker)}, String(process.pid));
            process.stdin.resume(); setTimeout(() => {}, 20000);`);

        // Cancel with nothing running: no dialog, no state change.
        await handlers.get('aiCodeReview.cancelCLIReview')();
        assert.equal(warnings.length, 0, 'idle cancel must not open a dialog');

        const startedRun = async () => {
            fs.rmSync(marker, { force: true });
            const run = Promise.resolve(handlers.get('aiCodeReview.runCLIReview')());
            // Attach immediately so a failure cannot become an unhandled rejection.
            const outcome = run.then(() => undefined, error => error);
            const deadline = Date.now() + 5000;
            while (!fs.existsSync(marker) && Date.now() < deadline) {
                await new Promise(resolve => setTimeout(resolve, 25));
            }
            assert.ok(fs.existsSync(marker), 'fixture must start and report its pid');
            assert.equal(status.kind, 'running');
            const pid = Number(fs.readFileSync(marker, 'utf8'));
            assert.ok(pid > 0);
            pids.push(pid);
            // Wrapped so awaiting the helper does not await the run itself.
            return { outcome };
        };

        // Dismissing the confirmation keeps the run alive.
        let started = await startedRun();
        confirmStop = false;
        await handlers.get('aiCodeReview.cancelCLIReview')();
        await new Promise(resolve => setTimeout(resolve, 150));
        assert.equal(status.kind, 'running', 'dismissed confirmation must not abort');
        process.kill(pids[0], 0);

        // Consenting stops the run.
        confirmStop = true;
        await handlers.get('aiCodeReview.cancelCLIReview')();
        assert.equal(await started.outcome, undefined);
        assert.equal(status.kind, 'idle');
        assert.throws(() => process.kill(pids[0], 0), /ESRCH/, 'fixture must be killed after consent');
        assert.ok(warnings.every(message => /Stop the running review/.test(message)), warnings.join('; '));

        // Extension shutdown aborts without a dialog.
        started = await startedRun();
        const dialogsBefore = warnings.length;
        subscriptions.forEach(item => item?.dispose?.());
        assert.equal(await started.outcome, undefined);
        assert.equal(warnings.length, dialogsBefore, 'dispose must abort without a confirmation dialog');
        assert.throws(() => process.kill(pids[1], 0), /ESRCH/);
    } finally {
        CodeReviewTreeProvider.prototype.setCLIStatus = setStatus;
        for (const pid of pids) { try { process.kill(-pid, 'SIGKILL'); } catch { /* already gone */ } }
        fs.rmSync(cwd, { recursive: true, force: true });
    }
});
