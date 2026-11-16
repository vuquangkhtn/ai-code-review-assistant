# Issue 2 QA v1

Reviewed head: c420937944d277b505d7c2cede53d7b709334a4c. Base: origin/main at 9f9d88b.
Classification: non-trivial process execution and extension-host integration. No migrations, money, or authentication changes. QA cannot merge.

## Verification

Node 20.19.4, isolated `.claude/worktrees/issue-2-qa` checkout. Main checkout changes were left intact.

`npm ci --silent && npm run check-types && npm run lint && npm run test:cli && npm run compile` exited 0.
Four real child-process tests passed: clean stdout, noisy stdout, exit 7, and invalid stdout. Lint: 0 errors, 63 warnings.
Manual prompt: diff against origin/main preserves the default manual path and template; its runtime hash assertion has not run here.
GUI execution was not attempted, following owner instruction in issue comment 6921144862: the lane sandbox kills Electron; GUI execution belongs outside the lane.
No screenshots captured: no running extension host available. No claim of visible results or clipboard preservation is made from Node tests.

## Acceptance ledger

| AC | Unit / process | Component | E2E |
|---|---|---|---|
| Full command to visible results, clipboard unchanged | none | none | cliReview.test.ts:23; committed, not executed |
| Prompt on stdin | src/test/node/cliReview.cjs:22; passed | n/a: process boundary | cliReview.test.ts:23; not executed |
| Noisy output extracted and displayed | src/test/node/cliReview.cjs:21; extraction passed | none | cliReview.test.ts:23; display not executed |
| Manual prompt unchanged | static baseline diff passed | n/a: template | cliReview.test.ts:11; hash not executed |
| Entire loop without internal mocks | n/a: requires extension host | none | cliReview.test.ts:23; not executed |

## Independent review and test gaps

Read implementation before author notes. Existing 11 file summaries and 2 inline notes describe the reviewed code; no prior defect findings were present. No proven implementation defect found in this pass.

The process tests assert actual persisted stdout and captured stdin, not mocks. The GUI tests assert new CodeLens issue identity, an open review panel, and unchanged clipboard. These assertions still need execution; source inspection cannot establish that the watcher delivers a new result.

High verification gap: real extension-host command, watcher and UI behavior is unexecuted for AC1, AC3 and AC5. The committed test is the appropriate layer. Owner must run it and capture the working UI before QA can pass.

Test gaps (not written): trusted-workspace rejection and missing command (High security regression coverage; needs extension host); output 4 MiB boundary and five-minute timeout (Medium); empty issues, Unicode and escaped braces in JSON (Medium); loading/error UI (Medium). Concurrency locking is explicitly a later ticket, not a tracer acceptance criterion. No assertions were weakened and no mocks were introduced.

## Truth check

Confidence: 65/100 against threshold 70. Process behavior has direct evidence; GUI behavior and manual prompt runtime hash do not. This is an environment verification block, not a product failure or approval request. No migrations or merge were attempted.

## Owner action

On a host outside the lane sandbox, using Node 20.19.4, run:

`npm ci --silent && npm run compile && npx tsc && CLI_REVIEW_TEST=1 npm test`

Supply output for this PR head and screenshots of the results panel. Return the card to QA for evidence verification; do not treat an approval comment as test evidence.
