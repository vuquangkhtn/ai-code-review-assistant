# Issue 4 builder evidence

Base: 60457bc260421a8ea61b8cc9fc151e1ce5289ca6 (issue 2 merged).
Preflight: proceed; near-match issue 5 adds lock UX, not tree/output/cancel.
Issue 4 has feature label and no comments; dependency 2 is closed.

## Verification

- Node 20.19.4: `npm ci --silent && npm run check-types && npm run lint` passed.
- `npm run test:cli`: 9/9 passed on Node 20.19.4.
- `npm run compile` and `git diff --check` passed.
- Lint: 0 errors; existing warnings plus callback parameter warning (64 total).
- Red: lifecycle test failed because stdout was invisible before process exit.
- Red: failure-tail test failed against the original unbounded error message.
- Green: real fixture stdout arrives before exit; abort kills its PID; no result is written.
- Green: nonzero exit retains final stderr text within a bounded error message.
- Existing clean/noisy/stdin/invalid-result tests remain green.
- GUI artifacts: `src/test/suite/cliStatus.test.ts` checks tree states and real-command cancellation.
- GUI command: `npm run compile && npx tsc && CLI_REVIEW_TEST=1 npm test`.
- GUI execution/screenshots pending QA or owner outside lane sandbox; no visual pass claimed.

## Inline independent review

Fixed point: 60457bc260421a8ea61b8cc9fc151e1ce5289ca6; spec: issue 4, all five ACs.
Standards: shared status union, manifest/handlers aligned, no dependency/version changes.
Spec: tree starts the custom command; status refreshes; stdout appends; failure details persist;
cancel terminates process group and clears status after close. GUI assertions await execution.
Found and fixed: CLI test discovery omitted the new status suite; cancellation during file write
could leave a result temporary file, now checked before rename with cleanup on failure.
Truth-check: process behavior 90/100 from real fixture runs; UI wiring 75/100 from source and
compiled test artifacts, pending live GUI evidence. Windows taskkill path is not executed here.
No blocking code findings remain. Builder does not approve or merge this draft.

## Docs consulted

- https://nodejs.org/api/child_process.html: detached process groups, stdout events and close.
- https://code.visualstudio.com/api/references/vscode-api: OutputChannel append/show and TreeItem commands.
- Installed Node types and VS Code 1.96 types: API compatibility checked by TypeScript.
