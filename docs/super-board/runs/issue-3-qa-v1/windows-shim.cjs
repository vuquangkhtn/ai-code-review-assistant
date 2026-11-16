// Run after npm run test:cli. Real PATH files; platform branch emulated on macOS.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../../../../');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-windows-cli-'));
const exportsUnderTest = {};
fs.writeFileSync(path.join(directory, 'claude.cmd'), '@echo off\r\necho {"issues":[]}\r\n');
vm.runInNewContext(fs.readFileSync(path.join(root, 'out/ai/CLIPresets.js'), 'utf8'), {
    exports: exportsUnderTest, require,
    process: { platform: 'win32', env: { PATH: directory } }
});
(async () => {
    try {
        const invocation = await exportsUnderTest.selectCLICommand({
            customCommand: '', savedProvider: undefined,
            choose: () => assert.fail('one provider must be silent'), save: async () => {}
        });
        assert.ok(invocation, 'a lone Windows CLI shim must be detected');
        console.log('PASS: Windows shim detected');
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
