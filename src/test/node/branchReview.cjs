const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const handlers = new Map();
let cwd, selection, picks, status;
const disposable = { dispose() {} };
const noop = () => disposable;
const ui = new Proxy({}, { get: () => noop });
const config = { get(key, fallback) {
    if (key === 'defaultChangeType') return selection === 'local' ? 'local' : 'branch';
    if (key === 'cli.customCommand') return `"${process.execPath}" "${path.resolve(__dirname, '../fixtures/review.cjs')}"`;
    return fallback;
} };
const vscode = {
    workspace: { get workspaceFolders() { return [{ uri: { fsPath: cwd } }]; }, isTrusted: true,
        getConfiguration: () => config, onDidChangeConfiguration: noop,
        createFileSystemWatcher: () => ui },
    window: { registerTreeDataProvider: noop, createOutputChannel: () => ui,
        createTextEditorDecorationType: () => disposable, onDidChangeActiveTextEditor: noop,
        showInformationMessage: noop, showWarningMessage: noop, showErrorMessage: noop,
        async showQuickPick(items, options) {
            picks++;
            assert.match(options.title, new RegExp(`Step ${picks}/2`));
            if (picks === 1) {
                assert.ok(items.some(item => item.label === 'main' && item.description === '(current)'));
                assert.match(options.placeHolder, /default: main/);
                if (selection === 'cancel-base') return undefined;
                return items.find(item => item.label === 'main');
            }
            assert.ok(!items.some(item => item.label === 'main'));
            return selection === 'cancel-target' ? undefined : items.find(item => item.label === 'target');
        } },
    commands: { registerCommand: (name, fn) => { handlers.set(name, fn); return disposable; }, executeCommand: noop },
    languages: { createDiagnosticCollection: () => ui, registerCodeLensProvider: noop },
    EventEmitter: class { fire() {} dispose() {} }, TreeItem: class {}, ThemeColor: class {}, ThemeIcon: class {},
    TreeItemCollapsibleState: { None: 0, Collapsed: 1 }, OverviewRulerLane: { Right: 4 },
    Uri: { file: fsPath => ({ fsPath }) }, RelativePattern: class {}, Range: class {}
};
const originalLoad = Module._load;
Module._load = function(id, ...args) { return id === 'vscode' ? vscode : originalLoad.call(this, id, ...args); };
const { activate } = require('../../../out/extension');
const { CodeReviewTreeProvider } = require('../../../out/ui/CodeReviewTreeProvider');
const setStatus = CodeReviewTreeProvider.prototype.setCLIStatus;
CodeReviewTreeProvider.prototype.setCLIStatus = function(value) { status = value; setStatus.call(this, value); };
Module._load = originalLoad;
for (const mode of ['branch', 'local', 'cancel-base', 'cancel-target', 'checkout-fail']) {
    test(`registered CLI command selects ${mode} changes`, async () => {
        cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'branch-review-'));
        selection = mode; picks = 0;
        const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
        const subscriptions = [];
        try {
            git('init', '-b', 'main');
            git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.com');
            fs.writeFileSync(path.join(cwd, 'sample.js'), 'let sample = 1;\n');
            git('add', '.'); git('commit', '-m', 'base');
            git('checkout', '-b', 'target');
            fs.writeFileSync(path.join(cwd, 'sample.js'), 'const sample = 18;\n');
            git('commit', '-am', 'target'); git('checkout', 'main');
            if (mode === 'checkout-fail') { fs.writeFileSync(path.join(cwd, 'sample.js'), 'local work to preserve\n'); }
            activate({ subscriptions, globalState: { get() {}, update: async () => {} } });
            await handlers.get('aiCodeReview.runCLIReview')();
            const received = path.join(cwd, 'received-prompt.txt');
            if (mode.startsWith('cancel') || mode === 'checkout-fail') {
                assert.equal(fs.existsSync(received), false);
                assert.equal(git('branch', '--show-current'), 'main');
                assert.equal(status.kind, 'idle');
                if (mode === 'checkout-fail') { assert.equal(fs.readFileSync(path.join(cwd, 'sample.js'), 'utf8'), 'local work to preserve\n'); }
                assert.equal(fs.existsSync(path.join(cwd, '.ai-code-review/changes')), false);
                selection = 'local';
                await handlers.get('aiCodeReview.runCLIReview')();
                assert.ok(fs.existsSync(received), 'run lock released');
            } else {
                assert.equal(picks, mode === 'local' ? 0 : 2);
                const prompt = fs.readFileSync(received, 'utf8');
                const changes = JSON.parse(fs.readFileSync(path.resolve(cwd, prompt.match(/Changes File:\*\* `([^`]+)`/)[1]), 'utf8'));
                assert.equal(changes.type, mode);
                if (mode === 'branch') {
                    assert.equal(changes.source, 'main'); assert.equal(changes.target, 'target');
                    assert.equal(git('branch', '--show-current'), 'target');
                    assert.match(changes.files[0].diff, /const sample = 18/);
                }
            }
        } finally {
            subscriptions.forEach(item => item?.dispose?.());
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    });
}
