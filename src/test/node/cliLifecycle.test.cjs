const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCLIReview } = require('../../../out/ai/CLIReview');

test('stdout arrives before exit; cancel kills the fixture and writes no result', { timeout: 5000 }, async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-live-'));
    const controller = new AbortController();
    let output = '';
    try {
        const script = path.join(cwd, 'slow.cjs');
        fs.writeFileSync(script, `process.stdin.resume(); console.log(process.pid); setTimeout(() => process.exit(0), 1500);`);
        let received;
        const live = new Promise(resolve => { received = resolve; });
        const running = runCLIReview({ command: `"${process.execPath}" "${script}"`, cwd, prompt: 'review',
            signal: controller.signal, onStdout: chunk => { output += chunk; received(); } });
        const rejected = assert.rejects(running, /cancelled/i);
        await Promise.race([live, new Promise(resolve => setTimeout(resolve, 500))]);
        assert.ok(output.length > 0, 'stdout must be visible while the fixture is still running');
        const pid = Number(output.trim());
        assert.ok(pid > 0);
        controller.abort();
        await rejected;
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.throws(() => process.kill(pid, 0), /ESRCH/);
        assert.ok(!fs.existsSync(path.join(cwd, '.ai-code-review/results')));
    } finally { controller.abort(); fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('failure includes the bounded stderr tail', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-fail-'));
    try {
        const script = path.join(cwd, 'fail.cjs');
        fs.writeFileSync(script, `process.stderr.write('x'.repeat(10000) + 'fixture failure'); process.exitCode = 2;`);
        await assert.rejects(runCLIReview({ command: `"${process.execPath}" "${script}"`, cwd, prompt: '' }), error => {
            assert.match(error.message, /fixture failure/);
            assert.ok(error.message.length < 5000);
            return true;
        });
    } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
