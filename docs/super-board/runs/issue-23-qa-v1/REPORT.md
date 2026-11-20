# QA report — issue #23 · cli-review fail fast on a stuck CLI

- PR: #35 · branch `issue-23-cli-stall-fail-fast` · head reviewed: `48e2027`
- Date: 2026-11-21 · host: macOS arm64, Node v20.19.4 (no GUI/display — node data/commands-layer surface per card environment note)
- Verdict: **PASS — 5/5 AC verified**

## Test plan (one observable test per AC)

| AC | Observable test (unit/node rung) | Result |
|---|---|---|
| AC1 silent CLI errors within the watchdog window with a stall message | `src/test/node/cliStall.cjs:16` — silent fixture, `stallTimeoutMs: 600`, asserts `/CLI review stalled/`, `/aiCodeReview\.cli\.stallTimeoutMs/`, elapsed < 5000 ms, fixture killed (ESRCH), no result file | pass, 708 ms (window 600 ms + kill overhead; full timeout is 300000 ms) |
| AC2 producing CLI is not killed by the watchdog | `cliStall.cjs:37` stdout producer outlives the 600 ms window and completes (1134 ms); `cliStall.cjs:56` stderr producer likewise (1053 ms) — stderr liveness, the risky half, pinned | pass |
| AC3 failure messages classify the cause | stall `cliStall.cjs:16`; spawn failure `cliStall.cjs:72` (`/CLI review failed to start/`, 6.5 ms); non-zero exit + stderr tail pre-existing `src/test/node/cliReview.cjs:17` + `src/test/node/cliLifecycle.test.cjs:32`; timeout classification pre-existing unchanged `src/ai/CLIReview.ts:81` (see gaps) | pass |
| AC4 switch suggestion on failure; output-channel + settings guidance without one | `src/test/node/cliPresets.cjs:210` (alternatives + `Select CLI Provider` wording), `:217` (no-alternative wording: output channel + `aiCodeReview.cli`), `:226` (custom provider → all detected); switcher behavior itself (`switchCLIProvider` persists and next run uses it) pinned by `cliPresets.cjs:138` from #22 | pass |
| AC5 test set required by the issue | stall-fast, producing-survives, switch suggestion, cancel-unchanged (`cliStall.cjs:82` asserts `/cancelled/i` and not `/stalled/`) — all present and green | pass |

e2e rung: n/a — no GUI/display in this environment; the sanctioned surface is `npm run test:cli`. The extension.ts wiring (`showErrorMessage` actions → `executeCommand('aiCodeReview.selectCLIProvider')`) is extension-host-only and was verified by code reading (`src/extension.ts:284-300`), not automated.

## Suite results (evidence files in this directory)

- `test-cli-output.log` — `npm run test:cli`: **78 tests, 77 pass, 0 fail, 1 skipped** (skip = pre-existing win32-only `Windows cmd shims…`), exit 0
- `check-types.log` — `npm run check-types` exit 0
- `lint.log` — `npx eslint src --ext ts` exit 0 (0 errors; 71 warnings, all pre-existing unused-var patterns on unchanged lines)
- `mutation-redcheck.log` — "test the tests" red-check: removed `markAlive()` from the stderr handler, rebuilt, `node --test src/test/node/cliStall.cjs` → `not ok 3 - stderr output also disarms the watchdog (conservative liveness)`, suite exit 1. The liveness test is not self-mocking; it fails when the behavior breaks.
- `mutation-restore-green.log` — mutation reverted, rebuilt, stall suite 5/5 pass again (mutant never committed)
- `probe-stall-zero-disable.log` — probe: `stallTimeoutMs: 0` disables the watchdog; a silent-until-1200 ms run completed in 1236 ms instead of stalling at the old 600 ms window

## AC proof lines

- AC1 ✅ silent fixture errors in 708 ms with the stall message at window 600 ms; fixture killed; no result written (`test-cli-output.log` test 35)
- AC2 ✅ stdout producer 1134 ms and stderr producer 1053 ms both outlive the 600 ms window and complete; watchdog disarmed (`test-cli-output.log` tests 36-37); mutant that drops stderr liveness is caught red (`mutation-redcheck.log`)
- AC3 ✅ stall / failed-to-start (ENOENT) / non-zero-exit-with-stderr-tail all asserted in the suite; timeout classification is pre-existing unchanged code (`git show 5893726:src/ai/CLIReview.ts` line 80)
- AC4 ✅ recovery wording branches pinned in `cliPresets.cjs:210/217/226`; switch action reuses the #22 switcher whose persistence behavior is pinned (`cliPresets.cjs:138`); wiring verified by code reading (`src/extension.ts:284-300`)
- AC5 ✅ all four required tests exist and pass; cancel path asserts cancelled-not-stalled (`cliStall.cjs:82`)

## Test gaps (not written — none block)

- **Medium** — `stallTimeoutMs: 0` (disable) has no committed test; only the probe in `probe-stall-zero-disable.log` covers it. Witness: `stallWindow > 0` guard at `src/ai/CLIReview.ts:88`. A regression to `>= 0` would arm a 0 ms watchdog on every run and no test would catch it.
- **Medium** — timeout classification (`CLI review timed out.`, `src/ai/CLIReview.ts:81`) has no test: the timer is hard-coded at 300000 ms, so an honest test needs a 5-minute wait or an app-code seam (e.g. a `timeoutMs` option). Pre-existing, unchanged by this diff.
- **Low** — comparison runs and quick-pick single runs never assign `attemptedProvider` (`src/extension.ts` comparison loop, and the auto+quick-pick path), so recovery may name the just-failed provider among the alternatives. AC4 is still satisfied (a switch action is offered when ≥1 alternative is detected); wording only.
- **Low** — extension.ts error-dialog wiring (actions → commands) is untestable without a VS Code host; covered by code reading only.

## Non-visual note

All ACs here are CLI/child-process behavior — no UI surface changes, so no screenshots are captured (intentional omission per run.md non-visual rule). Evidence is logs + this report.
