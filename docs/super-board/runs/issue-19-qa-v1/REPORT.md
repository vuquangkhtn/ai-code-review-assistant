# QA report — issue #19 · v1

- **Card:** ✨ [feature] manual-review: paste-guidance button on completion alert
- **Branch / head under test:** `issue-19-manual-review-paste-guidance` @ `97bcb5f01c7fb39625c8fdad5436b70c445cdc87`
- **Merge-base of the diff:** `a581a25` — changed files: `src/ai/ExternalAIManager.ts`, `src/test/node/manualPrompt.cjs` (new), `FEATURES.md`
- **Verdict:** ✅ PASS — 4/4 ACs verified at the process-test rung; no GUI available, fallback documented below.

## Environment

No GUI/display on this host (`npm test` via `@vscode/test-electron` downloads and runs a
VS Code window; it cannot run here). The change is a native VS Code information-message
button, and the Builder shipped a process-level Node harness (`src/test/node/manualPrompt.cjs`)
that stubs only the `vscode` module and exercises the real compiled manager
(`out/ai/ExternalAIManager`). Per run.md fallback: screenshots are **not captured** (no
display to render the notification — fabricating one is prohibited). Alternative evidence:
the test logs in this directory, which observe the actual `showInformationMessage` arguments
and the command dispatched on selection.

## Test plan — one observable test per AC

| AC | Observable test | Result |
|---|---|---|
| AC1 completion message gains a guidance button opening existing paste guidance | `manualPrompt.cjs` "…handles Paste to AI Chat…" (local + branch): asserts notification args contain `Paste to AI Chat…` (`manualPrompt.cjs:58-61`) and selecting it dispatches `aiCodeReview.pastePrompt` (`manualPrompt.cjs:62-63`); the command is the registered guidance flow (`src/extension.ts:395` shows the paste instructions). | ✅ pass ×2 |
| AC2 existing "Open Changes" preserved alongside | Same harness, "…handles Open Changes" (local + branch): deep-equal asserts both buttons in one message (`manualPrompt.cjs:58-61`) and selection dispatches `aiCodeReview.openChangeFile` (`src/ai/ExternalAIManager.ts:104`). | ✅ pass ×2 |
| AC3 works for local-changes AND compare-branches | Harness loops `for (const type of ['local','branch'])` (`manualPrompt.cjs:31`); each run asserts the correct detector path (`detected === type`), the type-specific message label, and that the prompt file is written per type. | ✅ pass ×6 (incl. dismissal) |
| AC4 test covers button appearance + guidance invocation | `src/test/node/manualPrompt.cjs` itself (6 tests): appearance = notification deep-equal; invocation = recorded `executeCommand` id. | ✅ pass 6/6 |

## Commands run (all at head `97bcb5f`)

1. `npx tsc && node --test src/test/node/manualPrompt.cjs` → 6/6 pass (`manualPrompt-tests.log`)
2. Mutation check (below) → 2 fail as designed (`mutation-red.log`), restored → 6/6 pass (`manualPrompt-after-restore.log`)
3. `npm run test:cli` → 40 tests, 39 pass, 1 skip (Windows-only path shim test), 0 fail (`testcli-full.log`)
4. `npm run check-types` → exit 0 (`static-checks.log`)
5. `npm run lint` → 0 errors, 66 pre-existing warnings (`static-checks.log`)
6. `npm run compile` → exit 0 (`static-checks.log`)

## Test the tests — mutation check

The Builder's suite was new in this diff and passed on its first run, so it was seen to fail
before being trusted: the guarded branch (`src/ai/ExternalAIManager.ts:105-106`, the
`pastePrompt` dispatch) was removed locally, `npx tsc` re-compiled, and the suite re-run.
Exactly the two guidance-invocation tests went red (`not ok 1`, `not ok 4`; 4 pass / 2 fail);
every other test stayed green. The change was then reverted with `git checkout --` (never
committed) and the suite returned to 6/6. Additional mutant checks by inspection:
swapping the two dispatch targets, or dropping the third button, is caught by the deep-equal
assertions at `manualPrompt.cjs:58-63`.

## Test-gap ledger (AC → rungs)

| AC | Unit/process | Component (VS Code UI) | E2E |
|---|---|---|---|
| AC1 | `src/test/node/manualPrompt.cjs:58-63` + `:105` dispatch | none — no display; code-verified wiring to `src/extension.ts:395` | none |
| AC2 | `src/test/node/manualPrompt.cjs:58-61` + `:63` | none — same | none |
| AC3 | `src/test/node/manualPrompt.cjs:31` loop covers both types | none — same | none |
| AC4 | the test file itself (`manualPrompt.cjs`) | n/a: AC is about the test existing | n/a: same |

Edge cases reviewed against the diff: dismissal (`selection === undefined` → no command)
pinned ×2; wrong-branch dispatch (openChangeFile vs pastePrompt swap) pinned by exact
command-id deep-equals; both change types pinned by detector stub + per-type prompt file
assertion. Not gaps: `all-files` request type also flows through the shared notification but
is outside AC3's stated scope (additive behavior, unchanged risk); no `.catch()` on the
`.then()` chain is the pre-existing pattern for the `Open Changes` path and unchanged by this
diff. The integration suite (`src/test/suite/ExternalAIManager.test.ts`) asserts nothing about
the notification buttons, so the change cannot regress it.

No High gaps found → no app-code change required → pass.

## Regression status

- `npm run test:cli` full suite: 0 fail (1 platform skip is a Windows-only case, correct on macOS).
- Existing suites untouched by the diff; no suite asserts on the completion notification.
