const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { selectCLICommand, switchCLIProvider, cliPresets } = require('../../../out/ai/CLIPresets');
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
    copilot: ['--silent', '--allow-tool=read', '-p'],
    zcode: ['-p']
};
const promptArgumentProviders = ['copilot', 'zcode'];

test('preset registry is data-driven and pins every documented invocation', () => {
    assert.deepEqual(cliPresets.map(preset => preset.id), Object.keys(expected));
    for (const preset of cliPresets) {
        assert.deepEqual(preset.args, expected[preset.id]);
        assert.equal(preset.promptArgument, promptArgumentProviders.includes(preset.id));
    }
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'package.json'), 'utf8'));
    assert.deepEqual(pkg.contributes.configuration.properties['aiCodeReview.cli.defaultProvider'].enum,
        ['auto', ...cliPresets.map(preset => preset.id)]);
    assert.ok(pkg.contributes.commands.some(command => command.command === 'aiCodeReview.selectCLIProvider'),
        'the switcher command must be declared for the palette');
});
for (const provider of Object.keys(expected)) {
    test(`one PATH ${provider} runs silently with documented flags`, { skip: process.platform === 'win32' }, async () => {
        await withPATHFixture([provider], async cwd => {
            const command = await selectCLICommand({ customCommand: '', savedProvider: undefined, choose: silent, save });
            const prompt = 'review "quotes" $HOME `touch injected`\nnew line';
            const file = await runCLIReview({ command, cwd, prompt });
            assert.deepEqual(JSON.parse(fs.readFileSync(file)), {issues:[]});
            assert.deepEqual(JSON.parse(fs.readFileSync(path.join(cwd, 'invocation.json'))), {
                args: promptArgumentProviders.includes(provider) ? [...expected[provider], prompt] : expected[provider],
                prompt: promptArgumentProviders.includes(provider) ? '' : prompt
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

test('Windows cmd shims run with literal arguments from a PATH containing spaces', { skip: process.platform !== 'win32' }, async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli shims-'));
    const previous = process.env.PATH;
    try {
        process.env.PATH = cwd;
        fs.writeFileSync(path.join(cwd, 'capture.cjs'), `const fs=require('fs');
fs.writeFileSync('invocation.json',JSON.stringify({args:process.argv.slice(2),prompt:fs.readFileSync(0,'utf8')}));
console.log('{"issues":[]}');`);
        for (const provider of Object.keys(expected)) {
            const shim = path.join(cwd, `${provider}.cmd`);
            fs.writeFileSync(shim, `@echo off\r\n"${process.execPath}" "%~dp0capture.cjs" %*\r\n`);
            const command = await selectCLICommand({customCommand:'', savedProvider:undefined, choose:silent, save});
            const prompt = 'review "quotes" & echo injected>injected | %PATH% !value! ^ (x)\nsecond line';
            const file = await runCLIReview({command, cwd, prompt});
            assert.deepEqual(JSON.parse(fs.readFileSync(file)), {issues:[]});
            assert.deepEqual(JSON.parse(fs.readFileSync(path.join(cwd, 'invocation.json'))), {
                args: promptArgumentProviders.includes(provider) ? [...expected[provider], prompt] : expected[provider],
                prompt: promptArgumentProviders.includes(provider) ? '' : prompt
            });
            assert.ok(!fs.existsSync(path.join(cwd, 'injected')));
            fs.unlinkSync(shim);
        }
    } finally { process.env.PATH = previous; fs.rmSync(cwd, {recursive:true, force:true}); }
});

test('defaultProvider setting overrides a stale persisted pick; auto keeps it', { skip: process.platform === 'win32' }, async () => {
    await withPATHFixture(['codex', 'claude'], async () => {
        const forced = await selectCLICommand({ customCommand:'', savedProvider:'codex', defaultProvider:'claude',
            choose:silent, save: async () => assert.fail('setting override must not re-prompt') });
        assert.equal(path.basename(forced.file), 'claude');
        await assert.rejects(selectCLICommand({ customCommand:'', savedProvider:'codex', defaultProvider:'zcode', choose:silent, save }),
            /defaultProvider is 'zcode' but the zcode CLI was not found on PATH.*'auto'/);
        const auto = await selectCLICommand({ customCommand:'', savedProvider:'codex', defaultProvider:'auto', choose:silent, save });
        assert.equal(path.basename(auto.file), 'codex');
        const blank = await selectCLICommand({ customCommand:'', savedProvider:'codex', defaultProvider:'  ', choose:silent, save });
        assert.equal(path.basename(blank.file), 'codex');
    });
});

test('switcher persists the picked provider and the next run uses it silently', { skip: process.platform === 'win32' }, async () => {
    await withPATHFixture(['codex', 'claude', 'copilot'], async () => {
        let persisted;
        const result = await switchCLIProvider({
            customCommand: '', defaultProviderSetting: 'auto', persistedProvider: 'codex',
            choose: async items => {
                assert.deepEqual(items.map(item => item.id), ['codex', 'claude', 'copilot']);
                assert.equal(items.find(item => item.id === 'codex').description, '(current)');
                return 'claude';
            },
            save: async provider => { persisted = provider; },
            saveSetting: async () => assert.fail('auto setting must not be rewritten')
        });
        assert.deepEqual(result, { kind: 'switched', provider: 'claude' });
        assert.equal(persisted, 'claude');
        const command = await selectCLICommand({ customCommand:'', savedProvider: persisted, defaultProvider: 'auto', choose:silent,
            save: async () => assert.fail('must not save again') });
        assert.equal(path.basename(command.file), 'claude');
    });
});

test('switcher reflects a concrete setting, rewrites it on switch, lists a not-found forced provider', { skip: process.platform === 'win32' }, async () => {
    await withPATHFixture(['codex', 'claude'], async () => {
        const settings = [];
        const result = await switchCLIProvider({
            customCommand: '', defaultProviderSetting: 'zcode', persistedProvider: 'codex',
            choose: async items => {
                const ids = items.map(item => item.id);
                assert.ok(ids.includes('zcode') && ids.includes('codex') && ids.includes('claude'));
                assert.equal(items.find(item => item.id === 'zcode').description, 'not found on PATH (current)');
                assert.equal(items.find(item => item.id === 'codex').description, '');
                return 'claude';
            },
            save: async provider => { settings.push('persisted:' + provider); },
            saveSetting: async provider => { settings.push('setting:' + provider); }
        });
        assert.deepEqual(result, { kind: 'switched', provider: 'claude' });
        assert.deepEqual(settings, ['persisted:claude', 'setting:claude']);
    });
});

test('switcher lists the configured custom command and marks it current', async () => {
    await withPATHFixture(['codex'], async () => {
        const result = await switchCLIProvider({
            customCommand: ' my-tool --review ', defaultProviderSetting: 'auto', persistedProvider: 'codex',
            choose: async items => {
                const custom = items.find(item => item.id === 'custom');
                assert.ok(custom, 'custom command is listed');
                assert.equal(custom.label, 'custom command');
                assert.equal(custom.description, 'my-tool --review (current)');
                return 'custom';
            },
            save: async () => assert.fail('custom pick must not persist a preset'),
            saveSetting: async () => assert.fail('custom pick must not rewrite the setting')
        });
        assert.deepEqual(result, { kind: 'switched', provider: 'custom' });
    });
});

test('switcher cancel changes nothing; empty PATH gives the actionable error', { skip: process.platform === 'win32' }, async () => {
    await withPATHFixture(['codex'], async cwd => {
        assert.deepEqual(await switchCLIProvider({ customCommand:'', defaultProviderSetting:'auto', persistedProvider:undefined,
            choose: async () => undefined, save: async () => assert.fail('cancel must not persist'),
            saveSetting: async () => assert.fail('cancel must not set') }), { kind: 'cancelled' });
        fs.chmodSync(path.join(cwd, 'codex'), 0o644);
        const result = await switchCLIProvider({ customCommand:'', defaultProviderSetting:'auto', persistedProvider:undefined,
            choose: async () => assert.fail('empty list must not ask'), save, saveSetting: async () => {} });
        assert.equal(result.kind, 'error');
        assert.match(result.message, /No supported CLI found on PATH.*customCommand/);
    });
});
