# Issue 3 QA v4

Reviewed head: 6c95d1ab20c5c12c526fe3534315807e3216322b. QA passes under the two issue-specific owner rulings. No merge performed; Reviewer owns the merge gate.

## Verification

`npm ci --silent && npm run check-types && npm run lint && npm run compile && npm run test:cli && node docs/super-board/runs/issue-3-qa-v1/windows-shim.cjs` exited 0. Output: verification.log.
16 tests pass, 0 fail, 1 intentional native Windows skip. Lint: 0 errors, 65 warnings.
Owner host run at db82766 records 4 passing extension-host tests against 6546047. Source and test files are unchanged between 6546047 and the reviewed head (git diff checked).

## Acceptance ledger

| AC | Unit/process evidence | Component | Extension host / other | Result |
|---|---|---|---|---|
| One provider silently completes | src/test/node/cliPresets.cjs:30; three real PATH fixtures assert flags, stdin/argv and results | n/a: native extension | src/test/suite/cliReview.test.ts:24 preset; owner host log | Pass |
| Multiple providers ask once and persist | cliPresets.cjs:45; disk state reused by a fresh selector, one picker call; missing saved provider reselects | n/a: native picker | extension.ts:118 globalState wiring inspected; owner accepts simulation and host proof | Pass under owner ruling |
| Custom override | cliPresets.cjs:66; no picker or save and explicit command returned | n/a | cliReview.test.ts:24 clean/noisy custom command; owner log | Pass |
| Invocation templates | cliPresets.cjs:30; exact Codex never/read-only, Claude text/headless, Copilot silent prompt; Windows detection reproducer passes | n/a: process contract | Native Windows fixture :84 skips on macOS; explicitly waived | Pass under owner ruling |
| Privacy scope | n/a: documentation | n/a | README and FEATURES inspected: CLI backend transmission requires explicit trigger | Pass |

## Prior findings and owner rulings

- Fixed: original Windows shim detection defect; fresh reproducer passes.
- No longer applies: requirement for native Windows execution; owner comment 7010028130 accepts fixture/reproducer coverage and the macOS skip.
- No longer applies: requirement for interactive picker/restart capture; owner comment 7010068130 accepts db82766 persistence simulation plus 4/4 host tests. No interactive capture is required.
- Not fixed: 0. Prior defect counts: 1 fixed, 0 not fixed, 2 evidence holds no longer apply.
- Screenshots were not captured. The owner explicitly accepts committed evidence instead of interactive capture. Prior unavailable-display/TCC evidence remains intact.

## Independent review and truth check

Read the issue, all issue/PR comments, all review comments and the complete current GitHub diff. Preflight uses fixture CLIs without backend credentials. Custom command precedes detection; saved choices are checked against current availability; cancellation does not save or run. Exact literal prompts and output/error limits have executable coverage. No new AC-blocking defect demonstrated.
Truth confidence: 90/100 against the issue and owner-accepted proof; above config threshold 70. This does not claim a new host run, native Windows execution, interactive restart or a live AI backend run.

## Test gaps (not written)

Medium: rejected persistence callback (save rejects), simultaneous selections (two calls before save), preset timeout, Unicode/very long prompt, accessible picker focus and loading/error states. These are partly covered branches or UI states, not uncovered ACs under the explicit owner rulings. No new High gap remains in issue scope.
Existing tests protect zero/one/many providers, cancellation, removed preferences, custom override, non-executable files/directories, quoted/metacharacter prompts, nonzero exit, malformed JSON and stdout/stderr limits. Expected flags are literal test data; assertions inspect actual child-process output rather than mocks.

## Integration handoff

`git merge-tree --write-tree origin/main HEAD` exits 1: conflicts in FEATURES.md, src/ai/CLIReview.ts and src/types/index.ts against main e9e4f36. Reviewer must reconcile the new main cancellation/status behavior with presets and rerun checks before merging. This QA pass changes evidence only and does not resolve integration conflicts or grant merge approval. The earlier owner size exception remains recorded; Reviewer must apply current merge policy independently.
