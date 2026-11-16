const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCLIReview } = require('../../../out/ai/CLIReview');

for (const mode of ['clean', 'noisy', 'fail', 'invalid']) {
    test(`real CLI receives stdin and handles ${mode} output`, async () => {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-review-'));
        try {
            fs.writeFileSync(path.join(cwd, 'changes.json'), JSON.stringify({ files: ['sample.js'] }));
            const prompt = 'You are an expert code reviewer\n**Changes File:** `changes.json`\nRespond with a JSON object only';
            const fixture = path.resolve(__dirname, '../fixtures/review.cjs');
            const command = `"${process.execPath}" "${fixture}" ${mode}`;
            if (mode === 'fail' || mode === 'invalid') {
                await assert.rejects(runCLIReview({ command, cwd, prompt }), mode === 'fail' ? /Command failed/ : /review JSON/);
                assert.ok(!fs.existsSync(path.join(cwd, '.ai-code-review/results')));
            } else {
                const file = await runCLIReview({ command, cwd, prompt });
                assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).issues[0].title, 'Fixture CLI issue');
                assert.equal(fs.readFileSync(path.join(cwd, 'received-prompt.txt'), 'utf8'), prompt);
            }
        } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
    });
}

for (const script of ["process.exit(7)", "process.stdout.write('x'.repeat(4*1024*1024+1))", "process.stderr.write('x'.repeat(4*1024*1024+1))"]) {
    test(`preset rejects failed or oversized output: ${script}`, async () => {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-limits-'));
        try {
            await assert.rejects(runCLIReview({command:{file:process.execPath, args:['-e',script], promptArgument:false}, cwd, prompt:''}), /CLI (exited|stdout|stderr)/);
            assert.ok(!fs.existsSync(path.join(cwd, '.ai-code-review/results')));
        } finally { fs.rmSync(cwd, {recursive:true, force:true}); }
    });
}
