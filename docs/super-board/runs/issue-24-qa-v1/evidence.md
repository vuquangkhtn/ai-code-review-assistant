# QA run · issue 24 · v1 — release trigger pre-merge verification

- Card: #24 `🚀 [release] trigger semantic-release publish skipped by 🚧[wip] PR #16`
- PR: #27 (branch `issue-24-trigger-release`, head `28943ad3042d068302379316a722878f36c1c936`, draft, base `main`)
- Builder handoff: `[builder] [report] ✅ built · round 1` (PR comment), prepared commit `28943ad`
- Date: 2026-11-21 · Lane: qa · Tester: super-board Tester (ZCode/GLM host)
- Screenshots: omitted — non-visual card (release-pipeline trigger, no UI ACs). Evidence is command output captured below.

## Environment

- Worktree `.claude/worktrees/issue-24-qa/` at Builder's branch tip `28943ad`; `git status` clean.
- Node v20.19.4 / npm 10.8.2; `npm ci` exit 0.
- Installed `@semantic-release/commit-analyzer` v13.0.1 (the repo's own dependency).

## Test plan — one observable check per AC

| AC | Observable check pre-merge | Result |
|---|---|---|
| AC1 `feat:` commit lands on `main` | PR #27 title == commit headline == `feat: release comparison and CLI-review batch`; installed commit-analyzer classifies it `minor`; pipeline `check-changes` grep `^[a-f0-9]+ feat` matches it. Actual "lands on `main`" is the squash merge — **deferred: post-merge (Reviewer)**. | PASS (pre-merge portion) |
| AC2 semantic-release runs and publishes a release containing PR #16 | `.releaserc.json` chain intact (analyzer → notes → changelog → npm `npmPublish: false` → git assets CHANGELOG.md/package.json/package-lock.json → github); analyzer returns `minor` for the post-merge commit set (wip + feat) so the run is not skipped; workflow trigger fires (`release/issue-24.json` outside `paths-ignore`); pipeline `should_release=true version_type=minor`; release job step `npx semantic-release` gated exactly on that. Actual publication (tag, GitHub release) — **deferred: post-merge (n/a)**. | PASS (pre-merge portion) |
| AC3 CHANGELOG.md and package.json on `main` reflect the new release | Owned by semantic-release after the merge; not verifiable pre-merge. | n/a: post-merge (by design) |

## Evidence per check

### 1. Release-worthy title (`analyzer-probe-output.txt`, script `analyzer-probe.mjs`)

Runs the installed plugin entry `analyzeCommits({}, context)` — semantic-release's real code path, not a reimplementation:

- `feat: release comparison and CLI-review batch` → `releaseType: "minor"`
- `🚧 [wip] comparison: compare two CLI providers` (PR #16 squash) → `releaseType: null` — reproduces the root cause mechanically
- wip + feat (what `main` will contain post-merge) → `releaseType: "minor"`

### 2. Pipeline detector (`check-changes-simulation.txt`)

Simulates `complete-pipeline.yml` lines 100–164 against real git state:

- Last tag `v0.9.0`; commits `v0.9.0..origin/main` include the PR #16 WIP squash and several `✨ [feat] …` emoji-prefixed squash titles — none match `^[a-f0-9]+ feat`, so no release has fired (consistent with the reported bug).
- Adding the post-merge squash subject `<sha> feat: release comparison and CLI-review batch` matches → `should_release=true version_type=minor` → `npx semantic-release` job runs.

### 3. Workflow trigger (`.github/workflows/complete-pipeline.yml` `on.push.paths-ignore`)

`paths-ignore` = `docs/**`, `*.md`, `.gitignore`, `.vscode/**`. The PR's only changed path `release/issue-24.json` is outside all exclusions, so the merge push starts the pipeline. `package.json` shows `0.9.0` matching the last tag; semantic-release owns the bump.

### 4. releaserc chain + npmPublish (`.releaserc.json:9-31`)

Plugins in order: `@semantic-release/commit-analyzer`, `release-notes-generator`, `changelog`, `@semantic-release/npm` with `"npmPublish": false` (line 16), `@semantic-release/git` with assets `CHANGELOG.md`, `package.json`, `package-lock.json` and a `chore(release): … [skip ci]` message, then `@semantic-release/github`. Matches the issue's stated chain; nothing ships to the npm registry.

### 5. Branch clean / no stray changes

- `git diff --stat origin/main...HEAD` → `release/issue-24.json | 8 ++++++++` — exactly one file, one commit (`28943ad`), nothing else.
- `release/issue-24.json` documents the trigger (issue, reason, source PR #16 + commit `a581a25`, merge subject, note that semantic-release owns versions/CHANGELOG). The issue's "empty commit acceptable" strategy is documented in the issue body and in the PR `solution` block: the record file replaces an empty commit so the merge has a diff that starts CI despite `paths-ignore`.

### 6. Local tests (Builder's command, re-run by Tester)

```
npm ci --silent && npm run check-types && npm run lint && npm run compile
```

- `npm ci` exit 0
- `check-types` (tsc --noEmit) exit 0
- `lint` exit 0 — 0 errors, 66 pre-existing warnings (unchanged from base; none on the added file)
- `compile` exit 0

## Test-gap check (super-qa → "Test-gap check")

Scope: `git diff --name-only origin/main...HEAD` = `release/issue-24.json` (data only, 8 lines).

Ledger (unit / component / e2e):

| AC | Unit | Component | e2e |
|---|---|---|---|
| AC1 | none (no code rung; inspection + analyzer probe is the proxy) | `docs/super-board/runs/issue-24-qa-v1/analyzer-probe.mjs` | n/a: post-merge |
| AC2 | none (no code rung) | `analyzer-probe.mjs` + `check-changes-simulation.txt` | n/a: post-merge |
| AC3 | n/a: pipeline-owned files | n/a | n/a: post-merge |

Edge cases:

- `paths-ignore` exclusion of the record path — pinned: `release/issue-24.json` not in `.github/workflows/complete-pipeline.yml` `on.push.paths-ignore`.
- WIP-title regression (the bug) — pinned: analyzer probe wip-only → `null`.
- Commit body `BREAKING CHANGE` — checked: absent from `28943ad` body (no `major` misfire).
- Squash title identity — pinned: PR title == commit headline; merge gate uses the PR title as `--subject`.
- npmPublish leak — pinned: `.releaserc.json:16` `"npmPublish": false`.
- Branch stray-changes — pinned: `git diff --stat origin/main...HEAD` = 1 file +8.

High gaps: none — every unproven AC portion is a post-merge outcome of the same pipeline already verified end-to-end at the analyzer/detector/trigger level, not a missing app-code test. No app code change needed → no bounce.

## Deferred to post-merge verification (explicit)

1. AC1's "lands on `main`" — the squash merge itself (Reviewer lane).
2. AC2's actual publication — semantic-release run result on `main` CI (tag, GitHub release, notes).
3. AC3 — CHANGELOG.md / package.json version on `main` after the release commit `chore(release): …`.

## Verdict

PASS on all pre-merge-verifiable checks; publish outcome explicitly deferred to post-merge. Card advances QA → Review.
