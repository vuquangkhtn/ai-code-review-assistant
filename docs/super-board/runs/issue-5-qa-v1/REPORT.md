# Issue 5 QA v1

Reviewed head: `99b5003c82b0b45361c958f2c6bd96f9a3c5b483`; base `origin/main`.

## Classification and independent review

Non-visual command behavior. No screenshots required. No migration or merge performed.
Read the implementation before author explanations; checked all issue comments, PR body,
complete diff, changed-file pages and review comments. No prior reviewer findings.
The dispatcher claim is the existing `vuquangkhtn` assignee; QA label added for this pass.
Preflight checklist complete; tracked main checkout clean. Dedicated detached QA worktree
avoids the branch already checked out by the owner at `/private/tmp/w5`.

## Acceptance ledger

| AC | Unit | Component | Real extension-host e2e |
|---|---|---|---|
| Refuse second CLI with explanation | none | n/a: command registration | cliStatus.test.ts:110–114 |
| Refuse copy-paste; preserve changes file | none | n/a: command registration | cliStatus.test.ts:108–114, all five commands |
| Both paths recover after finish/cancel | none | n/a: command registration | cliStatus.test.ts:116–138, also failure |
| Slow-fixture refused/released cycle | n/a: requires host | n/a: requires host | cliStatus.test.ts:62–146 |

All test paths above are under `src/test/suite/`. Warning text is captured from the
real command, bytes are read from the real changes file, and recovery checks the
clipboard/prompt file and a second child process marker; assertions do not assert
on their own mock return values. Red evidence at `11aaced` fails the refusal assertions.

## Verification and truth check

- QA reran `npm ci --silent && npm run check-types && npm run lint`: exit 0,
  0 errors, 64 existing warnings.
- QA reran `npm run test:cli`: 9 passed, 0 failed.
- QA attempted `CLI_REVIEW_TEST=1 CLI_TEST_VSCODE='/Applications/Visual Studio Code.app/Contents/MacOS/Code' node out/test/runTest.js`:
  host SIGABRT before assertions; this is not counted as green.
- Owner evidence already committed in `../issue-5-green/host-green.log`: 8 passing,
  exit 0, includes finish/cancel/fail, with matching current test source. The issue
  handoff explicitly identifies the two test-expectation fixes included in this head.
- Production lock code is unchanged since that captured green run. QA evidence commit
  changes documentation only. Confidence: 85/100; host run independently supplied by owner,
  not rerunnable inside this sandbox. Reviewer must assess that limitation.

## Edge cases and test gaps (not written)

Pinned: active second CLI and every copy command, file bytes preserved, success,
cancellation, nonzero exit, and recovery through both generation paths.
Medium: branch selection opened before CLI start and checkout settling during a CLI
run exercise the two additional guards at extension.ts:238 and :261; no dedicated
interleaving test exists. Medium: copy-paste already in progress before CLI startup
is outside the tested active-CLI-first sequence. Startup configuration rejection also
has no lock-specific recovery assertion. These are partly covered lifecycle/race branches;
no demonstrated failing acceptance criterion. Boundaries, money, dates, pagination,
auth ownership and responsive layouts are n/a for this boolean command lock.

No High test gaps found for the four scoped ACs. Pass to Review; QA does not merge.
