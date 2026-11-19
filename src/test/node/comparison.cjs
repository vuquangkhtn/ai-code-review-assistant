const { test } = require('node:test');
const assert = require('node:assert/strict');
const { groupComparison } = require('../../../out/ai/Comparison');
const issue = (title, filePath = 'a.ts', lineNumber = 2) => ({ title, filePath, lineNumber });
test('groups by file/line, matches normalized titles, retains each provider evidence', () => {
    const first = { ...issue('Unsafe result'), confidence: 'high', evidence: 'returns null' };
    const groups = groupComparison([
        { provider: 'one', issues: [first, issue('Other problem'), first] },
        { provider: 'two', issues: [issue(' unsafe RESULT '), issue('Other problem', 'b.ts')] }
    ]);
    assert.equal(groups.length, 2);
    assert.equal(groups[0].findings.length, 2);
    assert.deepEqual(groups[0].findings[0].entries.map(e => e.provider), ['one', 'two']);
    assert.equal(groups[0].findings[0].entries[0].issue.evidence, 'returns null');
    assert.equal(groups[0].findings[1].entries.length, 1);
    assert.equal(groups[1].filePath, 'b.ts');
});
test('different locations and different titles remain unique; empty reviews work', () => {
    assert.deepEqual(groupComparison([]), []);
    assert.equal(groupComparison([{ provider: 'one', issues: [issue('A'), issue('A', 'a.ts', 3)] }]).length, 2);
});

test('tree distinguishes shared and unique findings and displays confidence/evidence as plain text', () => {
    const Module = require('node:module');
    const originalLoad = Module._load;
    let ComparisonTreeProvider;
    Module._load = function (id, ...args) {
        if (id === 'vscode') return {
            EventEmitter: class { fire() {} dispose() {} },
            TreeItem: class { constructor(label) { this.label = label; } },
            TreeItemCollapsibleState: { Expanded: 2 }, ThemeIcon: class {}
        };
        return originalLoad.call(this, id, ...args);
    };
    try { ({ ComparisonTreeProvider } = require('../../../out/ui/ComparisonTreeProvider')); }
    finally { Module._load = originalLoad; }
    const finding = { ...issue('Result'), severity: 'high', confidence: 'high', evidence: '<script>bad</script>',
        description: 'Description', suggestions: [{ description: 'Check result' }] };
    const tree = new ComparisonTreeProvider();
    tree.update(groupComparison([{ provider: 'one', issues: [finding, { ...finding, title: 'Other' }] },
        { provider: 'two', issues: [finding] }]));
    const children = tree.getChildren(tree.getChildren()[0]);
    assert.equal(children[0].label, 'Shared: Result');
    assert.equal(children[0].description, 'one + two');
    assert.equal(children[1].label, 'Unique: Other');
    const detail = tree.getChildren(children[0])[0];
    assert.equal(detail.label, 'one: high');
    assert.equal(detail.description, 'Confidence: high');
    assert.equal(detail.tooltip, 'Description\n\nCheck result\n\nEvidence: <script>bad</script>');
    tree.update([]);
    assert.equal(tree.getChildren()[0].label, 'No findings from either provider');
    tree.dispose();
});
