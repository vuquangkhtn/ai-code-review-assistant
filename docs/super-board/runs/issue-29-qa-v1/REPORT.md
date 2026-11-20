# QA report — issue #29 (PR #30) · v1

Head under test: `ad769be` (`issue-29-fix-vsce-symlinks`). All checks run fresh on this QA
run, not the Builder's sim: separate clean-clone `git archive HEAD` + `npm ci` +
`npx @vscode/vsce@2.15.0` (CI's pinned version), separate symlink audit, local suite in the
QA worktree.

Verdict: PASS on AC1, AC2, AC3. AC4 is post-merge (reviewer verifies the green pipeline on
main). No screenshots: this issue is packaging/CI only, no UI surface — omission is
intentional; evidence below is logs and listings.

## Per-AC results

### AC1 — No committed symlink under `.zcode/` resolves outside the repo · PASS
- `git ls-files -s .zcode`: 126 entries, all mode `120000` (no regular files, no non-symlink
  stragglers) — `symlink-audit-zcode.txt`.
- All 126 blob targets are relative `../../.claude/skills/<name>`; 0 absolute. Each target
  resolves in the worktree through the committed chain
  `.zcode/skills/* -> ../../.claude/skills/* -> .agents/skills/*` (real files); 0 dangling.
- `realpath` containment for all 126: none escapes the repo root — `symlink-audit-zcode.txt`.
- Repo-wide sweep (stronger than asked): 243 tracked symlinks (`.claude/skills` 117,
  `.zcode/skills` 126), 0 absolute, 0 dangling, 0 escaping — `symlink-audit-repowide.txt`.
- Permanent regression guard added: `src/test/node/repoPackaging.cjs` (runs in
  `npm run test:cli`) asserts every tracked symlink is relative, resolvable and stays inside
  the repo. Red-first proven by injecting absolute / dangling / escaping blobs into the
  index (`repoPackaging-red-probe1-symlinks.log`, `repoPackaging-red-probe2-escape.log`);
  probes were never committed, index restored clean.

### AC2 — `.vscodeignore` excludes dev tooling from the vsix · PASS
- The diff adds `.zcode/**`, `.agents/**`, `.claude/**` to `.vscodeignore`.
- Control test proves the additions are load-bearing: with only those three lines removed
  from a copy of the clean clone, `vsce ls` collects 735 dev-tree files
  (`vsce-ls-control-without-new-ignore-lines.txt`); with them, zero
  (`vsce-ls-cleanclone.txt`). Delta analysis: `vscodeignore-delta-analysis.txt`.
- Nothing runtime-needed is excluded: the vsix keeps `dist/extension.js`, `package.json`,
  `resources/*.svg|png`, `LICENSE.txt`, `README.md`, `docs/sample.gif` —
  `vsix-contents.txt`. `src/**` exclusion is pre-existing and correct (source compiles to
  `dist/`).
- Permanent guard added: `repoPackaging.cjs` second test asserts the three rules exist;
  red-probe removing `.agents/**` fails it (`repoPackaging-red-probe3-vscodeignore.log`).

### AC3 — `vsce package` succeeds from a clean clone · PASS
- Fresh sim of CI's exact shape: `git archive HEAD` extracted to an empty temp dir
  (126 symlinks preserved, all resolve), `npm ci` (exit 0, mirrors CI's install step),
  then `npx --yes @vscode/vsce@2.15.0 ls` → exit 0, and `npx --yes @vscode/vsce@2.15.0 package`
  → exit 0, `DONE Packaged: ai-code-review-assistant-0.9.0.vsix (20 files, 7.81MB)`
  (`vsce-ls-cleanclone.txt`, `vsce-package-cleanclone.log`).
- 0 `ENOENT` occurrences in the package log; vsix contents contain no `.zcode/`, `.agents/`
  or `.claude/` paths (`vsix-contents.txt`).

### AC4 — Post-merge green pipeline on main · n/a: post-merge
- Needs the merged `complete-pipeline` run on main (tag + CHANGELOG from semantic-release).
  The reviewer verifies; nothing pre-merge can prove it. Pre-merge proxy evidence: CI's
  failing step ("Package VSIX for validation") was replicated locally and is green.

## Local suite

| Command | Result |
|---|---|
| `npm run check-types` | exit 0 (`check-types.log`) |
| `npm run lint` | exit 0 — 0 errors, 67 pre-existing warnings, no TS changed in this diff (`lint.log`) |
| `npm run test:cli` | exit 0 — 44 tests, 43 pass, 0 fail, 1 skip (41+1 pre-existing + 2 new guards) (`test-cli.log`) |

## Test-gap ledger

| AC | Unit | Component | e2e / pipeline |
|---|---|---|---|
| AC1 | `src/test/node/repoPackaging.cjs` (added) | audit evidence | CI checkout+package would still crash on violation |
| AC2 | `repoPackaging.cjs` rule assertion (added) | vsce ls control test (evidence) | CI packages every push; vsix bloat would regress silently |
| AC3 | n/a: vsce+npx unavailable as unit dep | clean-clone sim (evidence) | CI "Package VSIX for validation" asserts on merge |
| AC4 | n/a: post-merge | n/a | reviewer verifies pipeline run |

Edge classes checked for the 126 changed symlink blobs: all enumerated (no sampling);
absolute / empty / dangling / escaping targets each have a distinct assertion branch, each
red-proven; containment uses `realpath` so multi-hop chains (`.zcode → .claude → .agents`)
are covered.

## Test gaps (not written — not blocking)

- Low: the vsix still ships dev-adjacent files (`.gitmessage`, `.husky/*`,
  `.releaserc.json`, `AGENTS.md`, `CLAUDE.md`, `commitlint.config.js`, `FEATURES.md`,
  `release/issue-24.json`, `scripts/generate-changelog.js`). Pre-existing packaging
  behavior, unrelated to this fix; a follow-up issue could trim the vsix further.
- AC3 has no unit rung: packaging requires `npm ci` + vsce binary; CI's own packaging step
  is the durable assertion.

## Commands

```
git ls-files -s .zcode | grep ^120000            # 126/126 symlink blobs
python3 -I /tmp/qa29-symlink-audit.py <wt>       # relative/exist/containment → PASS
git archive HEAD | tar -x -C /tmp/qa29-clean-clone
cd /tmp/qa29-clean-clone && npm ci
npx --yes @vscode/vsce@2.15.0 ls                 # exit 0, 18 files, 0 dev-tree
npx --yes @vscode/vsce@2.15.0 package            # exit 0, 20 files, 7.81MB, 0 ENOENT
npm run check-types && npm run lint && npm run test:cli   # all green
```
