# Issue #20 QA test plan — one observable test per AC

PR #32, head `efb25b7`, base `main`. Environment: no GUI/display, so per repo conventions the
tests run at the data/commands layer (`src/test/node/*.cjs` via `npm run test:cli`); the VS Code
tree UI itself cannot be screenshotted headless — fallback evidence is the test log asserting the
row data and the manifest (see `test-cli-node.log`, `mutation-check.log`).

## AC → asserting test ledger

| AC | Observable test | Evidence |
|---|---|---|
| AC1 tree order/renames + palette titles | `cliTreeLifecycle.cjs` "tree rows: renames, order and pruned duplicate rows" asserts `['CLI Review','Manual Review','Review Type']` and group children unchanged; "manifest: …titles follow renames" asserts palette titles `CLI Review` / `Manual Review` | `test-cli-node.log` ok 24, ok 27 |
| AC2 no "CLI review: running" row; inline stop menu removed | "no status row is ever added next to the CLI Review row" asserts the 3-row shape under running/done/failed and no `CLI review:*` label; manifest test asserts no `cancelCLIReview` under `view/item/context` | `test-cli-node.log` ok 26, ok 27 |
| AC3 spinner + live progress + failure surfaced on the row | "CLI Review row transitions: idle → running with progress → done/failed → idle" asserts `loading~spin` icon, `3/10 files` description, `error` icon with failure message as description | `test-cli-node.log` ok 25 |
| AC4 click idle starts; click running / palette cancel → confirm; abort only on consent | "cancel asks for confirmation; dispose still aborts without a dialog" runs a real child-process review: idle cancel opens no dialog; dismissed confirm keeps the run alive; consented confirm aborts (ESRCH on the fixture pid); `context.subscriptions.dispose()` aborts without any dialog | `test-cli-node.log` ok 28 |
| AC5 guide/paste pruned from tree, palette invocable | tree test asserts no `Workflow Guide|Paste Prompt|Generate AI Prompt` rows; manifest test asserts `aiCodeReview.openWorkflowGuide` + `aiCodeReview.pastePrompt` remain in `contributes.commands` | `test-cli-node.log` ok 24, ok 27 |
| AC6 tests cover gate, transitions, palette availability | the five tests above are that coverage; `src/test/suite/cliStatus.test.ts` (display suite) mirrors transitions + confirmation and auto-consents in its cancel test | `test-cli-node.log` ok 24–28; PR diff |

## Edge cases pinned

- running with no progress payload yet → description falls back to `Running…` (ok 25, `/Running|files/`).
- cancel while idle → no dialog, no state change (ok 28, `warnings.length === 0`).
- dismissed confirmation → run survives, pid still alive (ok 28).
- consented confirmation → fixture process killed (ESRCH), status back to `idle` (ok 28).
- extension dispose → aborts without a confirmation dialog (ok 28) — the risk note's regression.

## Test-the-tests: mutation check

Mutant applied to compiled `out/extension.js`: abort regardless of the user's choice
(confirmation gate removed). `node --test src/test/node/cliTreeLifecycle.cjs` → **not ok 5**
("cancel asks for confirmation; dispose still aborts without a dialog"), 4 pass / 1 fail.
Restored original → 5 pass / 0 fail. The suite is not vacuous. See `mutation-check.log`.

## Commands run

- `npm run test:cli` → exit 0 · 54 tests, 53 pass, 0 fail, 1 skipped (pre-existing Windows-only
  skip in `cliPresets.cjs`, `skip: process.platform !== 'win32'` on darwin)
- `npm run check-types` → exit 0
- `npm run lint` → exit 0 · 0 errors, 67 warnings — identical count on `main`; the only warning in
  a touched file (`CodeReviewTreeProvider.ts:160 'command' is defined but never used`) exists on
  `main` at line 158. Nothing new introduced.

## Test gaps (not written; not blocking)

- Low: the modal option `{ modal: true }` of `showWarningMessage` is not asserted — only the
  message text is. Cosmetic; dialog modality is a VS Code rendering concern.
- Low: `aiCodeReview.cancelCLIReview` palette availability is exercised indirectly (row click maps
  the same command id); no test asserts its `contributes.commands` entry, which is unchanged by
  this PR.
- n/a: visual/spinner rendering and screenshot evidence — VS Code webview/tree cannot render
  without a display on this host; data-layer assertions + manifest test are the fallback evidence.
