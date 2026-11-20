# QA run · issue 24 · v2 — post-merge release verification (rebuild)

- Card: #24 `🚀 [release] trigger semantic-release publish skipped by 🚧[wip] PR #16`
- PR: #27 (branch `issue-24-trigger-release`, merged as squash `ff57bf0` on `main`)
- Rebuild cause: Reviewer bounce (v1 → AC3 release verification) because run 44794559815 crashed at `vsce package` on committed absolute symlinks; fixed by ticket #29 (PR #30 merged, squash `9465d97`)
- Date: 2026-11-21 · Lane: qa (Tester rebuild) · non-visual card — screenshots intentionally omitted, evidence is command output
- Every check below was re-verified independently in this pass; no claim is taken from the brief or from earlier lane comments.

## Per-AC results

| AC | Verified result | Proof |
|---|---|---|
| AC1 `feat:` commit lands on `main` | PASS (v1, unchanged) | squash `ff57bf0` subject `feat: release comparison and CLI-review batch` on `origin/main` |
| AC2 semantic-release runs and publishes a release containing PR #16 | **PASS** | run 44804277780 `release-and-tag` = success; GitHub release `v0.10.0` published (id 453108804, `2026-11-20T19:41:45Z`, target `main`); CHANGELOG 0.10.0 Features entry cites `ff57bf0` and `closes #16` |
| AC3 CHANGELOG.md and package.json on `main` reflect the new release | **PASS** | `git show origin/main:package.json` → `"version": "0.10.0"`; `git show origin/main:CHANGELOG.md` top section is `# [0.10.0] (2026-11-20)`; tag `v0.10.0` = commit `822ac16` (`chore(release): 0.10.0 [skip ci]`) |

## Verified checks and commands (rebuild-1)

1. **GitHub release v0.10.0 exists and is latest** — REST via `.claude/bin/super-board-github-read.py`:
   - `api repos/vuquangkhtn/ai-code-review-assistant/releases/tags/v0.10.0` → `tag_name: v0.10.0`, `draft: false`, `prerelease: false`, `published_at: 2026-11-20T19:41:45Z`, `target_commitish: main` (`release-by-tag.json`)
   - `api repos/vuquangkhtn/ai-code-review-assistant/releases/latest` → same id `453108804`, tag `v0.10.0` (`release-latest.json`) — it is the latest release.

2. **package.json on origin/main = 0.10.0** — `git show origin/main:package.json` → `"version": "0.10.0"` (`main-state-evidence.txt`).

3. **CHANGELOG.md on origin/main has the 0.10.0 section naming ff57bf0 and closing #16** — `git show origin/main:CHANGELOG.md` top section `# [0.10.0] (2026-11-20)`; Features bullet: `release comparison and CLI-review batch ([ff57bf0](…/commit/ff57bf047e3723860bd3e68410f00295f57c6644)), closes [#16](…/issues/16) [#24]` (`main-state-evidence.txt`).

4. **Tag v0.10.0 contains the comparison feature commits** — `git fetch origin --tags`; `git merge-base --is-ancestor a581a25 v0.10.0` → yes; `git merge-base --is-ancestor ff57bf0 v0.10.0` → yes; tag commit `822ac166a5e7b6c8d599bb96a430cb8b827d7ede` equals current `origin/main` tip (`main-state-evidence.txt`).

5. **CI run 44804277780 (head `9465d97` on `main`) per-job conclusions** — `api repos/vuquangkhtn/ai-code-review-assistant/actions/runs/44804277780/jobs` (`ci-run-44804277780-jobs.json`):
   - `build-and-test` = success
   - `validate-build` = success
   - `release-and-tag` = success ← semantic-release ran; tag + GitHub release + CHANGELOG/package.json commit produced
   - `prepare-publish` = success; `publish` = failure, failed step `Publish to VS Code Marketplace` — expired `VSCE_PAT`, owner-held ticket **#31**, out of scope for this card; noted, not blocking
   - `summary` = success

## Prior-verification continuity (v1, `issue-24-qa-v1/`)

Analyzer probe (installed `@semantic-release/commit-analyzer`): `feat:` title → `minor`, PR #16 WIP title → `null`, merged set → `minor`; pipeline detector simulation: `should_release=true version_type=minor` once the `feat:` squash lands; `.releaserc.json` chain intact with `npmPublish: false`. All pre-merge claims held; the post-merge deferrals are now closed by checks 1–5 above.

## Thread sweep (rebuild step 2)

PR #27 review comments: 6, all `<!-- super-board:author-note v1 -->` informational notes (builder + qa). Zero `[qa]`-prefixed findings exist, so there are no threads to resolve.

## Read-halt note

One read used a non-FORM shape kind (`--kind object` on the PR reviews array) and tripped the shared halt file; recovered per helper contract with `--resume` plus a same-kind replacement read; the original reason is preserved in `.claude/super-board/github-halt-1795204228441701000.json` (copy also at `/tmp/halt-preserved-reviews-read.json`). No mutation was retried; no state was lost.
