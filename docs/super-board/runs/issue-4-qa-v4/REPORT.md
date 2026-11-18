# Issue 4 QA v4

Classification: feature, QA rebuild for reviewer R1 (verification miss).
Result: pass with owner evidence and the existing owner screenshot/channel-hook ruling.
Head inspected: d36088a5c1b686b3be8aee5b49bb8616073db495.

## Verification

Fresh command: `npm ci --silent && npm run check-types && npm run lint && npm run test:cli && npm run compile`.
Exit 0; 9/9 Node tests pass; lint 0 errors, 64 warnings; typecheck and bundle pass.
Host evidence: `../issue-4-owner-gui-v2/host-run.log` contains five named passing tests, extension-host exit 0 and TEST-EXIT:0.
`OUTPUT.md` identifies Node 20.19.4, installed VS Code 1.146.x, application head 246f02a and owner-session execution.
`git diff 246f02a d36088a` contains only those two owner evidence files; all source, fixtures, package and lock files are unchanged.
The lane did not rerun the known sandbox-incompatible host launcher. This is credited owner evidence, not a fresh lane host pass.
R1 requested a working-host result at this application head; the committed raw log supplies it. No app fix is claimed.

## AC ledger

| AC | Unit / process | Component / host | Integration evidence and source |
|---|---|---|---|
| Tree run action starts a run | none | cliStatus.test.ts:10 asserts tree command | cliStatus.test.ts:29 starts custom command; owner host 5/5 |
| Running/done/failed and stderr tail | cliLifecycle.test.cjs:31 bounded failure tail | cliStatus.test.ts:10 asserts states, tooltip and failure command | extension.ts:115-149 wires runner state and error toast; owner host 5/5 |
| Dedicated channel streams live stdout | cliLifecycle.test.cjs:8 observes stdout before termination | none: write-only public channel API; hook declined by owner | extension.ts:63,130 creates named channel and appends callback chunks; source reviewed |
| Cancel kills process and clears status | cliLifecycle.test.cjs:8 verifies PID death and no result | cliStatus.test.ts:10 idle removes status; :29 registered cancel | extension.ts:145 clears state in finally; owner host cancellation passes |
| Custom command without preset | cliReview.test.cjs fixtures exercise supplied commands | cliStatus.test.ts:29 configures only customCommand | owner host run/cancel and clean/noisy tracer pass |

Screenshots omitted under the issue owner ruling: TCC denies capture in this host's noninteractive sessions. No screenshot claim is made.

## Independent review and test gaps

Inspected runner lifecycle, cancellation process group, bounded stdout/stderr, atomic result write, tree command mapping and extension cleanup before author-note explanations. No confirmed blocking application defect.
The tree test sets its own states: it proves rendering/command mapping, not runner-driven state transitions. Source wiring plus real process and owner-host results supply the accepted combined evidence.
AC3 has partial automated evidence; the existing owner ruling explicitly declines a production test hook and accepts process tests plus source wiring. It is not reopened as a new High gap.
Medium gaps not written: native Windows taskkill; stdout boundaries 4194303/4194304/4194305 bytes; timeout at 300000ms; double-submit while a run is active; end-to-end runner-driven tree status. Low: focus/layout.
No auth/money/schema changes. Existing output-size cap and timeout remain visible in source; no new dependency.
Truth assessment: 85/100 (threshold 70), based on fresh real-process results, unchanged application head, committed raw host log and source wiring. Limits: no fresh lane host launch, no screenshots or channel-read assertion, no native Windows run.
Prior findings: R1 fixed by new verification evidence; 0 not fixed; 0 no longer applies.

## Reviewer rerun

`npm ci --silent && npm run check-types && npm run lint && npm run test:cli && npm run compile`

Host recipe for an owner/desktop session: `npx tsc && CLI_REVIEW_TEST=1 CLI_TEST_VSCODE='/Applications/Visual Studio Code.app/Contents/MacOS/Code' node ./out/test/runTest.js`.
Do not misreport a sandbox launch failure as an application test failure. Compare the committed owner log and unchanged source before deciding whether another desktop run is needed.
