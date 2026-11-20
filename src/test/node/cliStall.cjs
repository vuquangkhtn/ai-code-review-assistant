const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCLIReview } = require('../../../out/ai/CLIReview');

const WINDOW_MS = 600;

function writeCommand(cwd, name, body) {
    const script = path.join(cwd, name);
    fs.writeFileSync(script, body);
    return `"${process.execPath}" "${script}"`;
}

test('silent CLI fails fast with a stall error instead of the full timeout', { timeout: 8000 }, async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-stall-'));
    try {
        const command = writeCommand(cwd, 'stall.cjs',
            `const fs = require('fs'); fs.writeFileSync('stall-pid.txt', String(process.pid)); process.stdin.resume(); setTimeout(() => process.exit(0), 15000);`);
        const started = Date.now();
        await assert.rejects(runCLIReview({ command, cwd, prompt: 'review', stallTimeoutMs: WINDOW_MS }), error => {
            assert.match(error.message, /CLI review stalled/);
            assert.match(error.message, /aiCodeReview\.cli\.stallTimeoutMs/);
            return true;
        });
        const elapsed = Date.now() - started;
        assert.ok(elapsed < 5000, `stall must fail fast, took ${elapsed} ms`);
        const pid = Number(fs.readFileSync(path.join(cwd, 'stall-pid.txt'), 'utf8'));
        assert.ok(pid > 0);
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.throws(() => process.kill(pid, 0), /ESRCH/, 'stalled fixture must be killed');
        assert.ok(!fs.existsSync(path.join(cwd, '.ai-code-review/results')));
    } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('a CLI that is producing stdout is not killed: first output disarms the watchdog', { timeout: 15000 }, async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-alive-'));
    try {
        const command = writeCommand(cwd, 'alive.cjs', `
let ticks = 0;
const timer = setInterval(() => { console.log('working ' + (++ticks)); }, 100);
setTimeout(() => {
    clearInterval(timer);
    console.log(JSON.stringify({ issues: [{ type: 'bug', severity: 'high', file: 'sample.js', line: 1, title: 'Alive fixture', description: 'd', suggestion: 's' }] }));
}, 1100);`);
        const started = Date.now();
        const file = await runCLIReview({ command, cwd, prompt: 'review', stallTimeoutMs: WINDOW_MS });
        const elapsed = Date.now() - started;
        assert.ok(elapsed > WINDOW_MS, 'run must outlive the watchdog window');
        assert.ok(elapsed < 10000, `producing run must not wait the full timeout, took ${elapsed} ms`);
        assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).issues[0].title, 'Alive fixture');
    } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('stderr output also disarms the watchdog (conservative liveness)', { timeout: 15000 }, async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-stderr-'));
    try {
        const command = writeCommand(cwd, 'thinking.cjs', `
const timer = setInterval(() => { process.stderr.write('thinking\\n'); }, 100);
setTimeout(() => {
    clearInterval(timer);
    console.log(JSON.stringify({ issues: [] }));
}, 1000);`);
        const started = Date.now();
        const file = await runCLIReview({ command, cwd, prompt: 'review', stallTimeoutMs: WINDOW_MS });
        assert.ok(Date.now() - started > WINDOW_MS, 'run must outlive the watchdog window');
        assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { issues: [] });
    } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('spawn failure is classified as failed to start', { timeout: 5000, skip: process.platform === 'win32' }, async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-spawn-'));
    try {
        await assert.rejects(runCLIReview({
            command: { file: path.join(cwd, 'missing-cli'), args: ['-p'], promptArgument: false }, cwd, prompt: ''
        }), /CLI review failed to start/);
        assert.ok(!fs.existsSync(path.join(cwd, '.ai-code-review/results')));
    } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('cancelling a silent run still reports cancelled, not stalled', { timeout: 8000 }, async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-cancel-'));
    const controller = new AbortController();
    try {
        const command = writeCommand(cwd, 'stall.cjs',
            `process.stdin.resume(); setTimeout(() => process.exit(0), 15000);`);
        const running = runCLIReview({ command, cwd, prompt: 'review', signal: controller.signal, stallTimeoutMs: WINDOW_MS });
        const rejected = assert.rejects(running, error => {
            assert.match(error.message, /cancelled/i);
            assert.doesNotMatch(error.message, /stalled/);
            return true;
        });
        await new Promise(resolve => setTimeout(resolve, 150));
        controller.abort();
        await rejected;
        assert.ok(!fs.existsSync(path.join(cwd, '.ai-code-review/results')));
    } finally { controller.abort(); fs.rmSync(cwd, { recursive: true, force: true }); }
});
