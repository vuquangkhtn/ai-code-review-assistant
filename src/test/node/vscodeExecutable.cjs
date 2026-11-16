const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveVSCodeExecutable } = require('../../../out/test/runTest');

for (const name of ['Code', 'Electron']) {
    test(`resolves ${name} without changing the signed bundle`, () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-bundle-'));
        try {
            const dir = path.join(root, 'Visual Studio Code.app', 'Contents', 'MacOS');
            fs.mkdirSync(dir, { recursive: true });
            const executable = path.join(dir, name);
            fs.writeFileSync(executable, 'fixture executable');
            assert.equal(resolveVSCodeExecutable(path.join(dir, 'Electron')), executable);
            assert.deepEqual(fs.readdirSync(dir), [name]);
            assert.equal(fs.readFileSync(executable, 'utf8'), 'fixture executable');
            assert.equal(resolveVSCodeExecutable(executable), executable);
        } finally { fs.rmSync(root, { recursive: true, force: true }); }
    });
}

test('preserves non-macOS executable paths', () => {
    assert.equal(resolveVSCodeExecutable('/cache/code'), '/cache/code');
});
