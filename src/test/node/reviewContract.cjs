const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const vm = require('node:vm');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
let blockOn = 'off';
const workspace = { workspaceFolders: [], getConfiguration: () => ({ get: () => blockOn }) };

// Only the extension-host API is stubbed; parser and renderers run their real code.
const originalLoad = Module._load;
Module._load = function (id, ...args) {
    if (id === 'vscode') return {
        workspace,
        EventEmitter: class { fire() {} },
        TreeItem: class {}, ThemeColor: class {}, ThemeIcon: class {},
        TreeItemCollapsibleState: { None: 0, Collapsed: 1 },
        Uri: { file: value => value }, Range: class {}
    };
    return originalLoad.call(this, id, ...args);
};
const { ResponseParser } = require('../../../out/ai/ResponseParser');
const { IssuesPanelProvider } = require('../../../out/ui/IssuesPanelProvider');
const { CodeReviewPanel } = require('../../../out/ui/CodeReviewPanel');
const { PromptGenerator } = require('../../../out/ai/PromptGenerator');
Module._load = originalLoad;

const fixture = { file: 'src/example.ts', line: 2, severity: 'high', type: 'bug',
    title: 'Unchecked result', description: 'The result can be empty.', suggestion: 'Check it.' };
function parse(extra = {}) {
    const result = ResponseParser.parseResponse(JSON.stringify({ issues: [{ ...fixture, ...extra }] }), 'fixture', []);
    assert.equal(result.issues.length, 1);
    return result.issues[0];
}
for (const confidence of ['high', 'medium', 'low']) {
    test(`parser round-trips ${confidence} confidence and evidence through saved JSON`, () => {
        const issue = parse({ confidence, evidence: 'src/example.ts:2 returns null' });
        const saved = JSON.parse(JSON.stringify(issue));
        assert.equal(saved.confidence, confidence);
        assert.equal(saved.evidence, 'src/example.ts:2 returns null');
    });
}
test('legacy results keep optional fields absent and retain existing content', () => {
    const issue = parse();
    assert.equal(issue.title, fixture.title);
    assert.equal(issue.description, fixture.description);
    assert.equal(issue.lineNumber, 2);
    assert.equal(Object.hasOwn(issue, 'confidence'), false);
    assert.equal(Object.hasOwn(issue, 'evidence'), false);
});
test('malformed optional fields do not discard a valid finding or reach renderers', () => {
    for (const confidence of ['certain', null, 1, {}]) {
        const issue = parse({ confidence, evidence: { html: '<script>' } });
        assert.equal(Object.hasOwn(issue, 'confidence'), false);
        assert.equal(Object.hasOwn(issue, 'evidence'), false);
    }
});

test('tree shows optional confidence without changing the legacy description', async () => {
    const provider = new IssuesPanelProvider();
    provider.updateIssues([parse(), parse({ confidence: 'medium' })]);
    const groups = await provider.getChildren();
    const items = await provider.getChildren(groups[0]);
    assert.equal(items[0].description, 'example.ts:2');
    assert.equal(items[1].description, 'example.ts:2 · medium confidence');
});

test('panel renders confidence only when supplied and escapes imported text', () => {
    const panel = { webview: { onDidReceiveMessage() {} }, onDidDispose() {} };
    CodeReviewPanel.revive(panel, {});
    const html = panel.webview.html;
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    const container = { innerHTML: '' };
    const context = vm.createContext({
        acquireVsCodeApi: () => ({ postMessage() {} }),
        window: { addEventListener() {} },
        document: {
            getElementById: () => container,
            createElement: () => ({ set textContent(text) { this.innerHTML = text.replace(/</g, '&lt;').replace(/>/g, '&gt;'); } })
        }
    });
    vm.runInContext(script, context);
    context.issues = [parse()];
    vm.runInContext('renderIssues(issues)', context);
    assert.doesNotMatch(container.innerHTML, /confidence|undefined/);
    context.issues = [parse({ confidence: 'high', evidence: '<script>bad</script>' })];
    vm.runInContext('renderIssues(issues)', context);
    assert.match(container.innerHTML, /high confidence/);
    assert.doesNotMatch(container.innerHTML, /<script>bad/);
});

test('manual and CLI prompt contracts request confidence and evidence', () => {
    const request = { changeInfo: { files: [] }, options: {} };
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'review-contract-'));
    workspace.workspaceFolders = [{ uri: { fsPath: cwd } }];
    try {
        const content = result => result.filePath ? fs.readFileSync(result.filePath, 'utf8') : result.content;
        const prompts = [PromptGenerator.generatePrompt(request),
            content(PromptGenerator.generateFileReferencePrompt('changes.json')),
            content(PromptGenerator.generateFileReferencePrompt('changes.json', 'cli'))];
        for (const prompt of prompts) {
            assert.match(prompt, /"confidence": "high\|medium\|low"/);
            assert.match(prompt, /"evidence":/);
            assert.match(prompt, /optional/i);
        }
    } finally { workspace.workspaceFolders = []; fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('tree flags only policy findings and adds a policy summary', async () => {
    blockOn = 'critical';
    try {
        const provider = new IssuesPanelProvider();
        provider.updateIssues([parse({ severity: 'critical' }), parse()]);
        const roots = await provider.getChildren();
        assert.equal(roots[0].label, 'Policy: 1 blocking findings (critical)');
        const groups = roots.filter(item => item.contextValue === 'issueGroup');
        const items = (await Promise.all(groups.map(group => provider.getChildren(group)))).flat();
        assert.match(items.find(item => item.tooltip.startsWith('critical')).label, /Blocking/);
        assert.equal(items.find(item => item.tooltip.startsWith('high')).label, fixture.title);
    } finally { blockOn = 'off'; }
});

test('panel flags threshold findings, preserves filtering, and clears policy when disabled', () => {
    const messages = [];
    let receive;
    const panel = { webview: { onDidReceiveMessage(fn) { receive = fn; }, postMessage(msg) { messages.push(msg); } }, onDidDispose() {} };
    CodeReviewPanel.revive(panel, {});
    const elements = new Map();
    let onMessage;
    const context = vm.createContext({
        acquireVsCodeApi: () => ({ postMessage() {} }),
        window: { addEventListener(_event, handler) { onMessage = handler; } },
        document: {
            getElementById: id => { if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', hidden: true }); return elements.get(id); },
            createElement: () => ({ set textContent(text) { this.innerHTML = text.replace(/</g, '&lt;').replace(/>/g, '&gt;'); } })
        }
    });
    vm.runInContext(panel.webview.html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
    const renderLast = () => {
        const message = messages.at(-1);
        onMessage({ data: message });
        return elements.get('issues-container').innerHTML;
    };
    blockOn = 'critical';
    try {
        const issues = [parse({ severity: 'critical' }), parse()];
        CodeReviewPanel.currentPanel.updateIssues(issues);
        assert.equal(messages.at(-1).policySummary, 'Policy: 1 blocking findings (critical)');
        assert.equal((renderLast().match(/Blocking/g) || []).length, 1);
        assert.equal(elements.get('policy-summary').hidden, false);
        assert.equal(elements.get('policy-summary').textContent, 'Policy: 1 blocking findings (critical)');
        assert.equal(Object.hasOwn(issues[0], 'policyBlocked'), false);
        receive({ command: 'filterIssues', severity: 'high' });
        assert.doesNotMatch(renderLast(), /Blocking/);
        assert.equal(messages.at(-1).policySummary, 'Policy: 1 blocking findings (critical)');
        blockOn = 'off';
        CodeReviewPanel.currentPanel.refreshPolicy();
        assert.equal(messages.at(-1).issues.length, 1);
        assert.equal(messages.at(-1).policySummary, '');
        assert.doesNotMatch(renderLast(), /Blocking/);
        assert.equal(elements.get('policy-summary').hidden, true);
    } finally { blockOn = 'off'; }
});
