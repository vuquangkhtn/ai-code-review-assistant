const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCLIReview } = require('../../../out/ai/CLIReview');

test('live progress counts split paths once and ignores ambiguous basenames', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-progress-'));
    const progress = [];
    let channel = '';
    const chunks = [];
    let live = false;
    try {
        const command = { file: process.execPath, args: ['-e', `
            process.stdin.resume();
            process.stdout.write('index.ts src/a/ind');
            setTimeout(() => process.stdout.write('ex.ts src/a/index.ts unique.ts'), 50);
            setTimeout(() => process.stdout.write(' src/b/index.tsx'), 100);
            setTimeout(() => process.stdout.write(' src/b/index.ts\\n{"issues":[]}'), 150);
        `], promptArgument: false };
        await runCLIReview({ command, cwd, prompt: '',
            review: { type: 'local', files: ['src/a/index.ts', 'src/b/index.ts', 'unique.ts'] },
            onStdout: chunk => { channel += chunk; chunks.push(chunk); },
            onProgress: value => {
                progress.push(value);
                if (value.reviewed === 1) {
                    live = !fs.existsSync(path.join(cwd, '.ai-code-review/results'));
                }
            }
        });
        assert.deepEqual(progress.map(p => p.reviewed), [0, 1, 2, 3]);
        assert.ok(progress.every(p => p.total === 3));
        assert.match(channel, /Command: .*node/);
        assert.match(channel, /Review type: local/);
        assert.match(channel, /src\/a\/index.ts\n.*src\/b\/index.ts\n.*unique.ts/);
        assert.match(channel, /Total files: 3/);
        assert.match(channel, /\[progress\] reviewed 3\/3 files/);
        assert.match(chunks[0], /Total files: 3/);
        assert.ok(chunks.includes('index.ts src/a/ind'));
        assert.ok(live, 'progress must arrive before results are saved');
    } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('each provider starts at zero; duplicate paths and final tokens count once', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-progress-'));
    try {
        for (let provider = 0; provider < 2; provider++) {
            const progress = [];
            await runCLIReview({
                command: { file: process.execPath,
                    args: ['-e', `process.stdin.resume(); process.stdout.write('{"issues":[]}\\nsrc/file.ts');`],
                    promptArgument: false },
                cwd, prompt: '', review: { type: 'local', files: ['src/file.ts', 'src/file.ts'] },
                onProgress: value => progress.push(value)
            });
            assert.deepEqual(progress, [{ reviewed: 0, total: 1 }, { reviewed: 1, total: 1 }]);
        }
    } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
