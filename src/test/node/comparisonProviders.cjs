const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { selectComparisonProviders } = require('../../../out/ai/CLIPresets');
const { runCLIReview } = require('../../../out/ai/CLIReview');
const { groupComparison } = require('../../../out/ai/Comparison');

const expectedArgs = {
    codex: ['--ask-for-approval', 'never', 'exec', '--sandbox', 'read-only', '-'],
    claude: ['-p', '--output-format', 'text'],
    copilot: ['--silent', '--allow-tool=read', '-p']
};

async function withPATHFixture(providers, run) {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli compare-'));
    const previous = process.env.PATH;
    try {
        process.env.PATH = cwd;
        for (const provider of providers) {
            fs.writeFileSync(path.join(cwd, provider), `#!${process.execPath}
const fs = require('fs');
const name = require('path').basename(process.argv[1]).split('.')[0];
fs.writeFileSync('invocation-' + name + '.json', JSON.stringify({args: process.argv.slice(2), prompt: fs.readFileSync(0, 'utf8')}));
console.log('{"issues":[{"title":"shared bug","filePath":"a.ts","lineNumber":1,"severity":"high"}]}');`, { mode: 0o755 });
        }
        await run(cwd);
    } finally { process.env.PATH = previous; fs.rmSync(cwd, { recursive: true, force: true }); }
}

const noAsk = () => assert.fail('must not ask');

test('empty setting with exactly two detected presets runs both without a picker, end to end', { skip: process.platform === 'win32' }, async () => {
    await withPATHFixture(['codex', 'claude'], async cwd => {
        const selection = await selectComparisonProviders({ configured: {}, choose: noAsk });
        assert.equal(selection.kind, 'providers');
        assert.deepEqual(selection.providers.map(provider => provider.label), ['codex', 'claude']);
        for (const provider of selection.providers) {
            assert.equal(typeof provider.command, 'object');
            assert.deepEqual(provider.command.args, expectedArgs[provider.label]);
            assert.equal(provider.command.promptArgument, false);
        }
        const reviews = [];
        for (const provider of selection.providers) {
            const file = await runCLIReview({ command: provider.command, cwd, prompt: 'review this' });
            reviews.push({ provider: provider.label, issues: JSON.parse(fs.readFileSync(file, 'utf8')).issues });
        }
        assert.deepEqual(reviews.map(review => review.provider), ['codex', 'claude']);
        for (const provider of ['codex', 'claude']) {
            assert.deepEqual(JSON.parse(fs.readFileSync(path.join(cwd, `invocation-${provider}.json`), 'utf8')),
                { args: expectedArgs[provider], prompt: 'review this' });
        }
        const groups = groupComparison(reviews);
        assert.equal(groups.length, 1);
        assert.deepEqual(groups[0].findings[0].entries.map(entry => entry.provider), ['codex', 'claude']);
    });
});

test('empty setting with more than two detected presets asks a picker for exactly two', { skip: process.platform === 'win32' }, async () => {
    await withPATHFixture(['codex', 'claude', 'copilot'], async cwd => {
        let items;
        const selection = await selectComparisonProviders({
            configured: {},
            choose: async offered => {
                items = offered;
                return offered.filter(item => item.label === 'claude' || item.label === 'copilot');
            }
        });
        assert.deepEqual(items.map(item => item.label), ['codex', 'claude', 'copilot']);
        assert.ok(items.every(item => item.picked === false));
        assert.equal(selection.kind, 'providers');
        assert.deepEqual(selection.providers.map(provider => provider.label), ['claude', 'copilot']);
        assert.equal(selection.providers[1].command.promptArgument, true);
    });
});

test('picking one or cancelling the detected picker errors or cancels cleanly', { skip: process.platform === 'win32' }, async () => {
    await withPATHFixture(['codex', 'claude', 'copilot'], async cwd => {
        const one = await selectComparisonProviders({ configured: {}, choose: async items => [items[0]] });
        assert.equal(one.kind, 'error');
        assert.equal(one.message, 'Select exactly two providers.');
        const cancelled = await selectComparisonProviders({ configured: {}, choose: async () => undefined });
        assert.equal(cancelled.kind, 'cancelled');
    });
});

test('named entries override detection and keep their labels and commands', async () => {
    await withPATHFixture(['codex', 'claude'], async () => {
        let offered;
        const selection = await selectComparisonProviders({
            configured: { first: ' echo one ', second: 'echo two', blank: '   ' },
            choose: async items => { offered = items; return items.filter(item => item.picked); }
        });
        assert.deepEqual(offered.map(item => item.label), ['first', 'second']);
        assert.ok(offered.every(item => item.picked === true), 'exactly two named entries are pre-picked');
        assert.equal(selection.kind, 'providers');
        assert.deepEqual(selection.providers.map(provider => provider.label), ['first', 'second']);
        assert.deepEqual(selection.providers.map(provider => provider.command), ['echo one', 'echo two']);
    });
});

test('more than two named entries pick exactly two; one named entry stays an explicit error', async () => {
    let offered;
    const picked = await selectComparisonProviders({
        configured: { one: 'cmd1', two: 'cmd2', three: 'cmd3' },
        choose: async items => { offered = items; return [items[2], items[0]]; }
    });
    assert.deepEqual(offered.map(item => item.label), ['one', 'two', 'three']);
    assert.ok(offered.every(item => item.picked === false));
    assert.equal(picked.kind, 'providers');
    assert.deepEqual(picked.providers.map(provider => provider.label), ['three', 'one']);

    const single = await selectComparisonProviders({ configured: { only: 'cmd' }, choose: noAsk });
    assert.equal(single.kind, 'error');
    assert.match(single.message, /aiCodeReview\.cli\.comparisonCommands/);
});

test('fewer than two detected providers and no setting give the actionable error', async () => {
    await withPATHFixture([], async () => {
        const selection = await selectComparisonProviders({ configured: {}, choose: noAsk });
        assert.equal(selection.kind, 'error');
        assert.match(selection.message, /aiCodeReview\.cli\.comparisonCommands/);
        assert.match(selection.message, /e\.g\./);
        assert.match(selection.message, /"claude".*"codex"/s);
    });
});
