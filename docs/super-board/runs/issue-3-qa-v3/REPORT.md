# Issue 3 QA v3

Reviewed head: db827669980293197f5f1a5e0f33ce519ca68ee9. Result: blocked.

## Verification

`npm ci --silent && npm run check-types && npm run lint && npm run compile && npm run test:cli && node docs/super-board/runs/issue-3-qa-v1/windows-shim.cjs` exited 0.
16 tests pass; 1 native-Windows test skips. Lint: 0 errors, 65 warnings.
Owner GUI evidence at `docs/super-board/runs/issue-3-owner-gui/` records four passing host tests against 6546047. Application source is unchanged since that run.

## Acceptance ledger

| AC | Unit/process | Component | Host | Decision |
|---|---|---|---|---|
| Lone provider silently completes | cliPresets.cjs:30, three executable fixtures | n/a | cliReview.test.ts:24 preset watcher test; owner log passes | POSIX supported; Windows execution pending |
| Multiple providers prompt once across sessions | cliPresets.cjs:45, disk-backed selector calls | n/a: native picker | none: host suite only supplies a lone codex | Partial; actual picker/globalState/restart missing |
| Custom override | cliPresets.cjs:66 | n/a | cliReview.test.ts:24 custom fixtures; owner log passes | Pass |
| Invocation templates | cliPresets.cjs:30 exact argv/stdin | n/a | n/a: process contract | POSIX pass; native Windows case at :84 skipped |
| Privacy scope | README and FEATURES explicit trigger/backend wording inspected | n/a | n/a: docs | Pass |

## Independent review and truth check

Prior detection defect is fixed. Prior palette-result evidence gap is cleared by the owner log. Prior picker/restart and Windows execution gaps remain open. No new production defect demonstrated.
The selector persistence fixture survives deleting extension.ts globalState.update: it supplies its own disk save callback. No host test asserts multiple-provider selection, globalState persistence or restart. Therefore the owner log cannot establish that part of AC2.
The owner artifact explicitly leaves native Windows execution open. A screenshot waiver mentioned for issue 4 is not a ruling for issue 3. No screenshots captured here; prior logs record unavailable display and TCC denial.
Truth gate: insufficient evidence to accept all ACs; no merge or passing score claimed.

## Test gaps

High existing verification gap: real multi-provider picker and restart persistence, at the extension-host/UI rung. Requires a working display. Existing Windows literal-argument test requires native Windows; emulated detection is not execution.
Medium/low not written: storage rejection, simultaneous invocation, preset timeout, Unicode/long argv, accessible picker focus and error states. Existing tests protect zero/one/many, cancellation, removed preferences, custom override, non-executables, directories, metacharacters, nonzero exit and output limits.

## Unblock

Capture multiple-provider selection and a real VS Code restart with the saved choice reused without a second picker. Run the native Windows literal-argument fixture. Capture the required screenshots, or obtain an explicit issue-3 ruling on the unavailable evidence. No app changes made in this QA pass.
