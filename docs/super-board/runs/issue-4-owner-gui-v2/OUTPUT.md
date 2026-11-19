# Owner GUI evidence v2 — PR #7 @ 246f02aee3d34944290689a3169dbe2bf08538a3
Run: `npx tsc && CLI_REVIEW_TEST=1 CLI_TEST_VSCODE=<installed 1.146.x> node ./out/test/runTest.js` — real extension host, Node 20.19.4, 2026-11-18T15:25Z (owner session; lane sandbox cannot launch the host)

```
  CLI review status
  ✔ tree offers a run, cancellation while running and failure details
  ✔ custom command can be cancelled from the registered tree command (257ms)
  CLI review tracer
  ✔ manual prompt including its tail matches the pre-feature baseline
  ✔ palette command delivers stdin and displays clean results via watcher (1005ms)
  ✔ palette command delivers stdin and displays noisy results via watcher (939ms)
  5 passing (2s)
Exit code: 0
```

Full raw log: `host-run.log` (this directory). Satisfies the 2026-11-18 QA v3 unblock checklist item "Run all five host tests at current application head".
