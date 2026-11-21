# Issue #39 QA report — v1

- **Date:** 2026-11-22
- **Lane:** super-board Tester (issue-scoped)
- **PR:** #42 · branch `issue-39-release-dispatch-overrides` · head at test time `b8fc7ed`
- **Worktree:** `/tmp/sb39qa` (short path, per QA discipline)
- **Verdict:** ✅ PASS — 5/5 AC verified · 1 MEDIUM + 1 LOW test gap handed off (not written; see ledger)
- **Scope:** `.github/workflows/complete-pipeline.yml`, `FEATURES.md`, `README.md` (3 files, +67/−56). `.releaserc.json` untouched.
- **Non-visual ACs:** this is a CI-workflow + docs issue; no screenshots captured (intentional — no UI surface changed).

## Test plan — one observable check per AC

| AC | Check | Result |
|---|---|---|
| AC1 | `version_type` input truly gone from the YAML dispatch form + no dead references | ✅ PASS |
| AC2 | `force_release` input + both force branches gone; no-changes tree yields `should_release=false` | ✅ PASS |
| AC3 | `release_created`/`new_version`/`tag_name` derived from a real `v*` tag diff; no-release path honest; gating wiring traced end to end; old false-success echo gone | ✅ PASS |
| AC4 | `.releaserc.json` byte-identical to `main`; bare `npx semantic-release`; check-changes grep patterns identical to `main` | ✅ PASS |
| AC5 | FEATURES.md + README.md document both trigger paths and match actual workflow behavior | ✅ PASS |

## Per-AC proof

### AC1 — `version_type` input no longer exists (resolved by removal)
- `grep -n version_type .github/workflows/*.yml` → **no matches**. The only remaining text is uppercase `VERSION_TYPE`, a local informational variable inside `check-changes` (`complete-pipeline.yml:115-120`, echoed at `:134` as an estimate), not an input or job output.
- Dispatch form now offers only `skip_publish` (`complete-pipeline.yml:11-17`).
- Job outputs of `build-and-test` reduced to `should_release` + `vsix_name` (`complete-pipeline.yml:36-38`); the old `version_type` output line is deleted.
- Repo-wide grep (`*.yml *.yaml *.json *.md`, excluding evidence + CHANGELOG): the single remaining mention is FEATURES.md:418 explaining the removal — documentation, not a live reference.

### AC2 — `force_release` input no longer exists (resolved by removal)
- `grep -n force_release .github/workflows/*.yml` → **no matches**.
- Force branch 1 (no-commits-since-tag): `complete-pipeline.yml:102-106` — unconditionally `should_release=false`, `exit 0`.
- Force branch 2 (commits exist but no significant type): `complete-pipeline.yml:121-130` — unconditionally `should_release=false`, `exit 0`.
- Trace: `should_release=false` → `validate-build`/`release-and-tag` skipped (`:165`, `:187`), `release-and-tag` outputs empty → `prepare-publish`/`publish` skipped (`:256`, `:269-272`), `summary` skipped (`:403`), `skip-notification` runs with the honest reason (`:444-454`).

### AC3 — `release_created` is true only on a real release
- Detection is a `git tag -l 'v*'` before/after diff around the real `npx semantic-release` run (`complete-pipeline.yml:231-250`): `BEFORE_TAGS` captured at `:231`, `git fetch --tags --force` at `:236`, `NEW_TAG` via `comm -13` at `:238`.
- Real-release path sets `new_version`/`tag_name`/`release_created=true` from the pushed tag (`:240-246`).
- No-release path sets `release_created=false` and prints the honest line "ℹ️ No release created — semantic-release found no relevant changes (publish stages are skipped)" (`:248-249`).
- **Previous false-success echo is gone:** `grep -n "if \[ -f package.json \]"` → no matches; the old package.json-existence branch that printed `✅ Released version <old>` on no-release runs is deleted. The `✅ Released` line now exists only inside the `NEW_TAG` non-empty branch (`:246`).
- **Gating wiring traced end to end:**
  - `release-and-tag` exposes `new_version`/`tag_name`/`release_created` as job outputs (`:188-191`).
  - `prepare-publish` `needs: [build-and-test, validate-build, release-and-tag]`, `if: should_release == 'true' && release_created == 'true'` (`:254-256`).
  - `publish` same plus `github.event.inputs.skip_publish != 'true'` (`:267-272`).
  - When `should_release=false`, `release-and-tag` is skipped, its outputs are empty, and both `== 'true'` comparisons are false → publish stages cannot run.
  - `summary` runs `always() && should_release == 'true'` and honestly reports "No release created" when `release_created != 'true'` (`:403`, `:431-433`).
  - `skip_publish=true` dispatch: `prepare-publish` still runs, `publish` skipped, `summary` prints "Publishing skipped (manual override)" (`:426-427`).
- **Behavioral simulation (6 cases, verbatim snippet replay):** `simulate-release-detection.sh` → all expected outcomes hold (`simulation-output.txt`):
  1. new tag after v0.10.0 → `release_created=true`, `new_version=0.11.0`, `tag_name=v0.11.0` ✅
  2. no new tag → `release_created=false` + honest line ✅ (this is the old bug's scenario — dispatch with `should_release=true` where semantic-release publishes nothing — now stops honestly)
  3. first release with empty `BEFORE_TAGS` → `release_created=true`, `v1.0.0` ✅ (comm empty-line edge handled)
  4. foreign tag arrives during the run while this run releases nothing → `release_created=true` — **documents the MEDIUM race gap below, recorded expectation, not a regression gate**
  5. multiple new tags → first sorted (`v0.11.0`) selected ✅
  6. non-`v*` tag ignored → honest no-release ✅

### AC4 — release strategy unchanged
- `git diff origin/main...HEAD -- .releaserc.json` → **empty** (byte-identical).
- Release step is still bare `npx semantic-release` (`complete-pipeline.yml:232`) — no flags, no plugin injections.
- `check-changes` grep patterns identical to `main` (verified line-by-line; main `:129-131,142` vs head `:109-111,123`):
  - `grep -i "BREAKING CHANGE"` · `grep -E "^[a-f0-9]+ feat"` · `grep -E "^[a-f0-9]+ fix"` · `grep -E "^[a-f0-9]+ (perf|refactor|build|ci)"`
- Bare `feat:`/`fix:` commits still set `should_release=true` (`:115-120`, `:133`) and commit-analyzer remains the sole bump authority → auto minor/patch releases unchanged (strategy from #24 / PR #27).

### AC5 — docs match actual behavior
- FEATURES.md `### Release automation` (`FEATURES.md:395-420`) and README.md `## 🚢 Releases` (`README.md:83-91`).
- Claim 1 "auto path: bare conventional-commit titles on main trigger releases; feat→minor, fix→patch, BREAKING→major" — matches default commit-analyzer rules + unchanged `check-changes` greps. ✅
- Claim 2 "manual dispatch offers only *Skip marketplace publishing*; it does not force a release or override the bump type" — matches `complete-pipeline.yml:11-17`. ✅
- Claim 3 "emoji-prefixed squash titles intentionally do not trigger a release" — titles like `✨ [feat] …` match neither `^[a-f0-9]+ feat` nor commit-analyzer rules; follow-up bare-commit workaround (empty `--allow-empty` commit) is valid: it matches the grep and semantic-release analyzes title-only commits. ✅
- Claim 4 "semantic-release has no forced-release mode; with no qualifying commits it reports no relevant changes and the pipeline stops before publishing" — matches AC2/AC3 code paths. ✅
- README anchor `[FEATURES.md → Release automation](FEATURES.md#release-automation)` resolves for the `### Release automation` heading. ✅

## Test-gap ledger (skill: super-qa "Test-gap check")

| AC | Rung | Asserting location | Note |
|---|---|---|---|
| AC1 | static (YAML) | `grep` over `complete-pipeline.yml` (this run) | input removal is only observable statically; no runtime equivalent needed |
| AC2 | static (YAML) | `complete-pipeline.yml:102-106,121-130` | trace recorded above |
| AC3 | behavioral sim | `simulate-release-detection.sh` (this run, 6 cases) | replay of the verbatim workflow snippet |
| AC4 | static (diff) | `git diff origin/main...HEAD -- .releaserc.json` (empty) | n/a beyond identity |
| AC5 | docs review | `FEATURES.md:395-420`, `README.md:83-91` | claims cross-checked against YAML |

### Edge cases hunted

- **Dispatch run with `should_release=true` where semantic-release publishes nothing** — the issue's core repro — covered by sim case 2 + wiring trace: `release_created=false`, publish stages skipped. ✅
- **Two concurrent pushes / overlapping dispatch runs, each creating a tag** — **MEDIUM gap (not written)**. See below.
- **A tag created manually right before a run** — if it matches `v*` it becomes `LAST_TAG` and semantic-release's release marker; a subsequent real release creates a new tag and is detected correctly (sim case 1 semantics). A manual non-`v` tag is invisible to both greps (`v*` filter) and detection (sim case 6) → honest no-release. A manual `v*` tag with the same name semantic-release would create makes semantic-release itself fail → step fails → publish skipped (fail-safe). ✅
- **`skip_publish=true` interplay** — `prepare-publish` still runs; `publish` additionally gated on `skip_publish != 'true'` (`:272`); push events leave the input empty (`'' != 'true'` → publish allowed). ✅
- **Multiple new `v*` tags** — `head -1` picks the first sorted; with a real release present the real tag is picked when it sorts first (sim case 5). ✅
- **Workflow re-trigger on semantic-release's own commit** — the release commit (CHANGELOG/package.json via `@semantic-release/git`) re-fires the pipeline on main; `git log $LAST_TAG..HEAD` is then empty → honest `should_release=false`. No loop. ✅

### Gaps handed off (not written — per QA rules, no workflow-code changes from QA)

- **MEDIUM — race window can resurrect a false `release_created=true` under concurrent pipeline runs.** If another run (push or dispatch) publishes a `v*` tag between this run's `BEFORE_TAGS` capture (`complete-pipeline.yml:231`) and its `git fetch --tags --force` (`:236`), `comm` attributes the foreign tag to this run: `release_created=true` even though this run's semantic-release published nothing. Reproduced exactly by sim case 4 (`race-foreign-tag`) and bounded by sim case 5. Severity MEDIUM: needs two overlapping runs on `main` inside roughly a minute; the publish job then checks out a tag whose content equals what was actually released, so the harm is a duplicate publish attempt and an inaccurate per-run summary, not data loss. What fixed should look like (needs workflow change, hence not written): verify the detected `NEW_TAG` points at the release commit of *this* run (e.g. `git merge-base --is-ancestor HEAD "$NEW_TAG"` plus confirming semantic-release's own success), or capture semantic-release's decision directly (its `Published release` output or an `@semantic-release/exec` hook) instead of attributing any new tag. Repro: `simulate-release-detection.sh` case 4 in this evidence folder.
- **LOW — `summary` wording is imprecise on the no-release-with-grep-worthy-commits path.** `complete-pipeline.yml:432` prints "No significant changes detected" even when `check-changes` matched (e.g. `ci:`/`refactor:` titles) but commit-analyzer released nothing; the precise honest line already appears in the release job log (`:249`). Pre-existing wording, no behavior change — cosmetic only.

### "Test the tests" check

- The simulation replays the verbatim snippet copied from the workflow rather than a reimplementation — it cannot drift into asserting its own logic. Its expectations were written before running; case 4's `true` expectation is a documented-behavior record, explicitly flagged as such in the script and output.
- Surviving-mutant scan on the detection snippet: flipping `comm -13` → `comm -13` with unsorted input, dropping `sort -u`, or reverting to the old `package.json` check would each flip sim cases 2/6 (honest no-release) — red. The one mutation sim cannot catch: a change to the `publish`/`prepare-publish` job conditions in the YAML (static trace covers it, no executable test exists for Actions conditions — accepted, that is GitHub's runner's job).

## Environment notes

- `npm run lint` skipped environmentally: worktree has no `node_modules` (only the primary checkout does) and the PR touches no TypeScript (`eslint: command not found`). YAML validity confirmed via `python3 -c "import yaml; yaml.safe_load(...)"` → OK.
- No `npm ci` performed (PR touches no package code).
- Hard rules honored: no workflow dispatch, no tags pushed, no push to `main`, no merge, no workflow-code edits by QA.

## Evidence files

- `REPORT.md` — this report
- `commands.log` — every command run, with key output
- `simulate-release-detection.sh` — repeatable 6-case simulation of the release-detection snippet
- `simulation-output.txt` — its captured output (6/6 expected outcomes)
