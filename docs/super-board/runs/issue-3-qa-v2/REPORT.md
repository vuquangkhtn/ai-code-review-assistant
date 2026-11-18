# Issue 3 QA v2

Application head: `1515a82b1f3e4fafa824001ad777f077a1e45230`. Decision: blocked on host evidence.

## Verification

`npm ci --silent && npm run check-types && npm run lint && npm run compile && npm run test:cli && node docs/super-board/runs/issue-3-qa-v1/windows-shim.cjs` exited 0.
Typecheck and compilation passed; lint reported 0 errors and 65 warnings.
Node fixtures: 16 passed, 0 failed, 1 native-Windows test skipped on macOS.
The previous Windows detection witness now prints `PASS: Windows shim detected`.

`CLI_REVIEW_TEST=1 CLI_TEST_VSCODE='/Applications/Visual Studio Code.app/Contents/MacOS/Code' node out/test/runTest.js` exited 1 with SIGABRT before assertions (extension-host.log).
The first attempt used the absent Electron filename; correcting it to the installed Code executable exposed SIGABRT.
`screencapture -x /tmp/issue3-qa-display.png` failed: `could not create image from display`.
No desktop, tablet, mobile or per-AC screenshots were captured. No live AI backend was invoked.

## AC ledger

| AC | Unit / process fixture | Component | Extension host / visual | Result |
|---|---|---|---|---|
| 1: lone provider silently completes | src/test/node/cliPresets.cjs:30, three actual executables and parsed result files | n/a: selector has no component layer | src/test/suite/cliReview.test.ts:24, could not execute | Partial; native Windows launch and palette-to-result evidence missing |
| 2: ask once, persist sessions | src/test/node/cliPresets.cjs:45, disk-backed selection | n/a: native Quick Pick | none: no actual Quick Pick/restart assertion | Partial; callbacks do not prove VS Code globalState wiring |
| 3: custom command wins | src/test/node/cliPresets.cjs:66 | n/a | cliReview.test.ts custom fixtures could not execute | Process-level pass |
| 4: invocation templates | src/test/node/cliPresets.cjs:30, exact argv/stdin and literal metacharacters | n/a | n/a: process contract | POSIX pass; Windows case at line 84 skipped |
| 5: privacy documentation | n/a: documentation | n/a | n/a: documentation | README and FEATURES diff explicitly describes triggered CLI backend transmission |

## Independent review and test gaps

Read the changed selector, runner, extension wiring, tests, manifest and privacy text before author-note explanations.
All 18 PR threads were read with complete comment pages; no human replies or owned fix requests were present.
The previous concrete detection defect is fixed. The prior GUI verification gap remains open.
No additional application defect was demonstrated on this host.

Zero providers, one/many, removed saved provider, cancellation, non-executable files, directory impostors, custom override, quoted prompts, nonzero exit, and output limits have assertions.
No money/date or ownership logic changed. Existing trusted-workspace check precedes selection.
Tests launch real PATH executables and inspect their argv/stdin and output files; expectations are not recomputed by production code.
The persistence fixture does not protect a mutant removing globalState.update in extension.ts:119; live host evidence is required, not a mocked substitute.
Native Windows quoting is a security-sensitive verification gap with an existing executable test; it cannot be run on this macOS host.
Medium gaps not written: globalState write rejection, simultaneous command invocation, preset timeout, Unicode/very long argv, accessible picker focus and empty/error UI states.
Truth assessment: insufficient evidence for acceptance; three ACs have direct supporting evidence, two remain partial. No pass score is claimed.

## Unblock

On a host with a working VS Code display, run the scoped extension suite above, then select among fixture providers, restart VS Code and verify no second picker. Capture each affected AC and desktop/tablet/mobile views.
On Windows run `npm ci --silent && npm run test:cli`; retain the native shim literal-argument result.
Return the card to QA with that evidence. This is an environment verification block, not a request to change application code or merge.
