# Issue 13 QA v1

Reviewed head: 523db2fbaff3037ad75ad4b685221ec973bcfe95 (application code 53e4766).
Classification: feature; native VS Code tree and CLI orchestration. No migrations.
Independent source review: grouping, provider attribution, text tooltips, command registration,
trusted-workspace guard, shared run lock, cancellation and output persistence inspected inline.
No blocking defect found. No prior reviewer findings.

## Acceptance ledger
| AC | Unit | Component | Host e2e |
|---|---|---|---|
| Two providers, same changes, two files | CLI subprocess fixtures in src/test/node/cliReview.cjs | n/a: command needs host | src/test/suite/cliComparison.test.ts:33-39 |
| Grouping, tags, shared/unique, confidence/evidence | src/test/node/comparison.cjs:5-23 | src/test/node/comparison.cjs:26-51 | src/test/suite/cliComparison.test.ts:44-52 |
| Node fixtures and host flow | node-tests.log: 33 pass, one Windows skip | same component fixture | owner-gui/host-run.log:487-493: 10 passing, exit 0 |

## Verification
`npm ci --silent && npm run test:cli && npm run check-types && npm run lint && npm run compile`
passed. Lint has 66 warnings and zero errors. node-tests.log and checks.log preserve output.
Local host attempt: `CLI_REVIEW_TEST=1 CLI_TEST_VSCODE='/Applications/Visual Studio Code.app/Contents/MacOS/Code' node out/test/runTest.js`
failed before Mocha with SIGABRT; see host-attempt.log. This is not counted as a pass.
Accepted host proof is the owner-session run committed in 523db2f, as explicitly required by AC3.
Its raw transcript records the comparison test passing. Only evidence files differ from tested 53e4766.
Screenshots were not captured: owner-session OUTPUT.md and issue handoff document TCC denial
and the standing screenshot ruling. Alternative evidence: ../issue-13-owner-gui/host-run.log.

## Test-gap review
No High gaps: each AC has observable assertions. Existing tests cover empty input,
location separation, title normalization, provider deduplication, unique/shared findings,
evidence retention, plain-text hostile strings and clearing the tree. CLI fixtures cover
invalid output, subprocess failure, output size and cancellation. Tests assert returned
values and saved files rather than their own mocks. No new tests were needed.

Test gaps (not written), Medium: comparison-specific second-provider failure and cancellation
between providers; selecting zero/one/three entries; actual registered tree contents rather
than a fresh tree instance; fixed one-second picker wait can race on a slow host.
Low: native tree icon appearance lacks a screenshot because capture is denied.
These do not remove existing happy-path AC coverage.

## Truth check
All three ACs have executable proof; host proof is owner-session evidence, not a local rerun.
Confidence: 85/100. Screenshot limitation and Medium gaps remain explicit.
QA does not merge; Reviewer must run its policy/merge gate independently.
