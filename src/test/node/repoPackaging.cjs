const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Repo root: src/test/node/<this file> -> three levels up. Guard for issue #29:
// absolute or dangling committed symlinks crash `vsce package` in CI clean
// checkouts, which blocked every release (see issue #29).
const repoRoot = fs.realpathSync(path.resolve(__dirname, '..', '..', '..'));

function trackedSymlinkTargets(root) {
    const out = execFileSync('git', ['ls-files', '-s'], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
    });
    const symlinks = [];
    for (const line of out.split('\n')) {
        if (!line.trim() || !line.startsWith('120000')) {
            continue;
        }
        const [meta, file] = line.split('\t');
        const oid = meta.trim().split(' ')[1];
        const target = execFileSync('git', ['cat-file', 'blob', oid], {
            cwd: root,
            encoding: 'utf8',
        }).replace(/\n$/, '');
        symlinks.push({ file, target });
    }
    return symlinks;
}

test('issue #29 AC1: every tracked symlink is relative, resolvable and stays inside the repo', () => {
    const symlinks = trackedSymlinkTargets(repoRoot);
    assert.ok(
        symlinks.length >= 126,
        `expected the vendored skill symlinks to be present, found ${symlinks.length}`,
    );
    const violations = [];
    for (const { file, target } of symlinks) {
        if (target.startsWith('/')) {
            violations.push(`${file} -> absolute target ${target}`);
            continue;
        }
        if (target.trim() === '') {
            violations.push(`${file} -> empty target`);
            continue;
        }
        const resolvedRel = path.posix.normalize(
            path.posix.join(path.posix.dirname(file), target),
        );
        const resolvedAbs = path.join(repoRoot, resolvedRel);
        if (!fs.existsSync(resolvedAbs)) {
            violations.push(`${file} -> dangling target ${target}`);
            continue;
        }
        const real = fs.realpathSync(resolvedAbs);
        if (real !== repoRoot && !real.startsWith(repoRoot + path.sep)) {
            violations.push(`${file} -> target escapes the repo (${real})`);
        }
    }
    assert.deepEqual(
        violations,
        [],
        `dangling/absolute/out-of-repo tracked symlinks:\n${violations.join('\n')}`,
    );
});

test('issue #29 AC2: .vscodeignore excludes the agent dev trees from the vsix', () => {
    const rules = fs
        .readFileSync(path.join(repoRoot, '.vscodeignore'), 'utf8')
        .split('\n')
        .map(line => line.trim());
    for (const rule of ['.zcode/**', '.agents/**', '.claude/**']) {
        assert.ok(
            rules.includes(rule),
            `.vscodeignore is missing '${rule}' — the dev tree would ship in the vsix (735 files leaked without it)`,
        );
    }
});
