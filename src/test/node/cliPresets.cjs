const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { selectCLICommand } = require('../../../out/ai/CLIPresets');
const { runCLIReview } = require('../../../out/ai/CLIReview');

async function withPATHFixture(providers, run) {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli presets-'));
    const previous = process.env.PATH;
    try {
        process.env.PATH = cwd;
        for (const provider of providers) {
            fs.writeFileSync(path.join(cwd, provider), `#!${process.execPath}\nconst fs = require('fs');
fs.writeFileSync('invocation.json', JSON.stringify({args:process.argv.slice(2),prompt:fs.readFileSync(0,'utf8')}));
console.log('{"issues":[]}');`, { mode: 0o755 });
        }
        await run(cwd);
    } finally { process.env.PATH = previous; fs.rmSync(cwd, {recursive:true, force:true}); }
}
const silent = () => assert.fail('must not ask');
const save = async () => {};
const expected = {
    codex: ['--ask-for-approval', 'never', 'exec', '--sandbox', 'read-only', '-'],
    claude: ['-p', '--output-format', 'text'],
    copilot: ['--silent', '--allow-tool=read', '-p']
};
for (const provider of Object.keys(expected)) {
    test(`one PATH ${provider} runs silently with documented flags`, { skip: process.platform === 'win32' }, async () => {
        await withPATHFixture([provider], async cwd => {
            const command = await selectCLICommand({ customCommand: '', savedProvider: undefined, choose: silent, save });
            const prompt = 'review "quotes" $HOME `touch injected`\nnew line';
            const file = await runCLIReview({ command, cwd, prompt });
            assert.deepEqual(JSON.parse(fs.readFileSync(file)), {issues:[]});
            assert.deepEqual(JSON.parse(fs.readFileSync(path.join(cwd, 'invocation.json'))), {
                args: provider === 'copilot' ? [...expected[provider], prompt] : expected[provider],
                prompt: provider === 'copilot' ? '' : prompt
            });
            assert.ok(!fs.existsSync(path.join(cwd, 'injected')));
        });
    });
}

test('multiple providers ask once and reuse persisted choice in a fresh selection', { skip: process.platform === 'win32' }, async () => {
    await withPATHFixture(['codex', 'claude', 'copilot'], async cwd => {
        const storage = path.join(cwd, 'state.json');
        let asked = 0;
        const command = await selectCLICommand({ customCommand:'', savedProvider: undefined,
            choose: async providers => { asked++; assert.deepEqual(providers, ['codex','claude','copilot']); return 'claude'; },
            save: async provider => fs.writeFileSync(storage, JSON.stringify({provider})) });
        const restored = await selectCLICommand({ customCommand:'', savedProvider: JSON.parse(fs.readFileSync(storage)).provider,
            choose: silent, save: async () => assert.fail('must not save again') });
        assert.deepEqual(restored, command);
        assert.equal(asked, 1);
        fs.unlinkSync(path.join(cwd, 'claude'));
        let saved;
        const replacement = await selectCLICommand({ customCommand:'', savedProvider:'claude',
            choose: async providers => { assert.deepEqual(providers, ['codex','copilot']); return 'codex'; },
            save: async provider => { saved = provider; } });
        assert.equal(saved, 'codex');
        assert.equal(path.basename(replacement.file), 'codex');
    });
});

test('custom command overrides presets and stored preference without asking', async () => {
    await withPATHFixture(['codex'], async () => {
        assert.equal(await selectCLICommand({ customCommand:' custom --review ', savedProvider:'claude',
            choose:silent, save: async () => assert.fail('custom must not change default') }), 'custom --review');
    });
});

test('cancel does not save or run; missing executables give an actionable error', { skip: process.platform === 'win32' }, async () => {
    await withPATHFixture(['codex', 'claude'], async cwd => {
        assert.equal(await selectCLICommand({ customCommand:'', savedProvider:undefined,
            choose:async () => undefined, save:async () => assert.fail('cancel must not persist') }), undefined);
        fs.chmodSync(path.join(cwd, 'codex'), 0o644);
        fs.unlinkSync(path.join(cwd, 'claude'));
        fs.mkdirSync(path.join(cwd, 'copilot'));
        await assert.rejects(selectCLICommand({ customCommand:'', savedProvider:undefined, choose:silent, save }), /No supported CLI found on PATH.*customCommand/);
    });
});
