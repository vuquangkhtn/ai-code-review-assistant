# QA report — issue #21 · comparison: work out of the box with detected presets

- PR: #33 · head reviewed: `f87e321` (branch `issue-21-comparison-detected-presets`)
- Environment: macOS arm64, no GUI/display — data/commands-layer tests via `npm run test:cli` (per Builder handoff; the vscode-integration suites need a display and are out of scope here)
- Date: 2026-11-21

## Result: PASS (5/5 AC verified)

## AC ledger

| AC | Asserting test (file:line) | Rung | Result |
|---|---|---|---|
| AC1 empty setting + ≥2 detected → runs end to end, no error | `src/test/node/comparisonProviders.cjs:35` (exactly-two detected, `choose: noAsk`, runs both fixtures through `runCLIReview`, asserts exact argv + prompt + `groupComparison` output) | node/integration | ✅ ok 32 |
| AC2 >2 detected → picker chooses two | `src/test/node/comparisonProviders.cjs:62` (3 detected; picker offered all 3 with `picked: false`; picks claude+copilot; copilot `promptArgument: true`) | node | ✅ ok 33 |
| AC3 <2 detected + no setting → error names setting + concrete two-entry example | `src/test/node/comparisonProviders.cjs:119` (0 detected; message matches `aiCodeReview.cli.comparisonCommands`, `e.g.`, and the `"claude"…"codex"` example) | node | ✅ ok 37 |
| AC4 named entries override detection + labels in output headers | `src/test/node/comparisonProviders.cjs:88` (override, labels `first`/`second`, commands `echo one`/`echo two`) · `:100` (>2 named picker, 1-named error) · **QA addition** `:129` (named override end to end: named string commands executed via `runCLIReview`, named labels surface in `groupComparison` entries) · **QA addition** `:148` (named-picker cancel → `cancelled`) | node | ✅ ok 35, 36, 38, 39 |
| AC5 Tests: detected default run, >2 picker, named override, improved error path | 6 Builder tests + 2 QA additions in `src/test/node/comparisonProviders.cjs` | node | ✅ |

Not covered at any rung (n/a): the `extension.ts` compare-handler glue (`selection.kind` dispatch, `Provider: <label>` output line, error toast) requires the VS Code extension host; no display in this environment. Its inputs/outputs are pinned at the data layer instead: selection → `runCLIReview` → `ResponseParser`-shaped issues → `groupComparison` entries carry provider labels.

## Test-gap check over the Builder diff

Scope: `git diff 53ee79b..f87e321` — `src/ai/CLIPresets.ts`, `src/extension.ts`, `src/test/node/comparisonProviders.cjs`, `package.json` (setting description), `FEATURES.md`.

Edge cases pinned by Builder tests: blank/whitespace-only named entries filtered (`:88` via `blank: '   '`); exactly-one named entry → explicit error naming the setting (`:100`); pick-one from detected picker → `Select exactly two providers.` (`:74`); cancel detected picker → `cancelled` (`:74`); whitespace in named commands trimmed (`:88`); exactly-two detected fires no picker (`:35` `noAsk`).

High gaps found and written in this QA pass (red-first verified):

1. AC4 second clause — "labels still appear in comparison output headers" was only proven for the detected path; named labels stopped at the selection object. Added `comparisonProviders.cjs:129`: named string commands actually executed (shell spawn through PATH fixture), grouped output entries carry the named labels `['Codex CLI', 'Claude CLI']`.
2. Named-picker cancel path (`CLIPresets.ts:69`) had no test. Added `comparisonProviders.cjs:148` → `cancelled`.

Mutation checks (both mutations applied to `src/ai/CLIPresets.ts`, never committed):

- labels mutated to a fixed string in the named branch → 3 failures including the new named end-to-end test (`/tmp` captured as mutation1 evidence in run log below); restored → green.
- named-branch cancel turned into an error → `cancelling the named-entries picker cancels cleanly` red (`comparisonProviders.cjs:148`); restored → green.

Test-the-tests: Builder tests run real fixture executables through production `selectComparisonProviders`/`runCLIReview`/`groupComparison`/`extractReviewJSON`; assertions pin exact argv, prompt bytes, labels, and messages. No assertion recomputes the expected value with the code under test. Surviving-mutant scan: `named.length >= 2` → `> 2` caught by test 4; `detected.length > 2` → `>= 2` caught by test 1's `noAsk`; removal of the `named.length === 1` branch caught by test 5.

Test gaps (not written, non-blocking):

- Low: `detected.length === 1` (exactly one detected) reuses the same `< 2` error branch as the zero case; only zero is pinned. Same message, same branch.
- Low: unknown labels returned by the picker (impossible via real `showQuickPick`) collapse to the `providers.length !== 2` error — defensive branch untested.
- n/a: extension-handler glue (above).

## Runs

| Run | Command | Result |
|---|---|---|
| Builder baseline (f87e321, before QA additions) | `npm run test:cli` | 60 tests · 59 pass · 0 fail · 1 skip (win32) |
| QA additions first run | `npx tsc && node --test src/test/node/comparisonProviders.cjs` | 8 tests · 8 pass · 0 fail |
| Mutation 1 (named labels broken) | same | 8 tests · 5 pass · **3 fail** → restored |
| Mutation 2 (named cancel broken) | same | 8 tests · 7 pass · **1 fail** → restored |
| Final full suite | `npm run test:cli` | **62 tests · 61 pass · 0 fail · 1 skip (win32)** — `test-cli-full.log` |
| `npm run check-types` | tsc --noEmit | clean (exit 0) |
| `npm run lint` | eslint src | clean (exit 0) |

## Local tests (Reviewer rerun gate)

```
Local tests: npm run test:cli
```
