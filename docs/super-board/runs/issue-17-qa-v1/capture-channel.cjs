// QA evidence capture for issue #17 (PR #26).
// Runs the real compiled runCLIReview against a fixture provider that streams
// in chunks, and dumps (a) the exact text a CLI output channel would receive,
// in order, and (b) every CLI run status payload emitted through onProgress.
// This reproduces what the extension host appends via cliOutput.append
// (src/extension.ts onStdout wiring) without needing a live VS Code window.
'use strict';
const { runCLIReview } = require('/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-17-qa/out/ai/CLIReview.js');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const OUT_DIR = '/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-17-qa/docs/super-board/runs/issue-17-qa-v1';

async function main() {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-progress-qa-'));
    const events = [];
    const statusPayloads = [];
    const chunks = [];
    try {
        const command = { file: process.execPath, args: ['-e', `
            process.stdin.resume();
            process.stdout.write('Reviewing index.ts src/a/ind');
            setTimeout(() => process.stdout.write('ex.ts src/a/index.ts unique.ts'), 50);
            setTimeout(() => process.stdout.write(' src/b/index.tsx'), 100);
            setTimeout(() => process.stdout.write(' src/b/index.ts\\n{"issues":[]}'), 150);
        `], promptArgument: false };
        await runCLIReview({
            command, cwd, prompt: '',
            review: { type: 'local', files: ['src/a/index.ts', 'src/b/index.ts', 'unique.ts'] },
            onStdout: chunk => { chunks.push(chunk); events.push(chunk); },
            onProgress: progress => {
                statusPayloads.push(progress);
                events.push(`[[CLI-RUN-STATUS-PAYLOAD: ${JSON.stringify(progress)}]]`);
            }
        });
        const report = [
            '=== AC1/AC5 evidence: exact output-channel text, in arrival order ===',
            '(Each "[[CLI-RUN-STATUS-PAYLOAD: ...]]" line marks the moment the CLI run',
            ' status was set to { kind: "running", progress } via setCLIStatus.)',
            '',
            ...events,
            '',
            '=== AC4 evidence: CLI run status payloads in order ===',
            JSON.stringify(statusPayloads, null, 2),
            '',
            '=== AC2 evidence: provider stdout chunk boundaries ===',
            JSON.stringify(chunks, null, 2),
            ''
        ].join('\n');
        fs.writeFileSync(path.join(OUT_DIR, 'channel-capture.txt'), report, 'utf8');
        console.log(report);
    } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
}
main().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
