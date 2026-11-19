const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const vm = require('node:vm');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const workspace = { workspaceFolders: [] };

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
