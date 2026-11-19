# Owner GUI evidence — PR #8 @ 65460473969e40985d93707bebd7d14de3f8ef59
Run: `npm run compile && npm run lint && npx tsc && node --test src/test/node/*.cjs && CLI_REVIEW_TEST=1 CLI_TEST_VSCODE=<installed 1.146.x> node ./out/test/runTest.js` — real extension host, Node 20.19.4, 2026-11-18T15:26Z (owner session; lane sandbox cannot launch the host)

```
compile (check-types + esbuild): OK
lint: 0 errors, 65 warnings
node fixtures: 17 tests — 16 pass, 0 fail, 1 skipped (platform-gated)
  incl. "multiple providers ask once and reuse persisted choice in a fresh selection"
  (selectCLICommand fresh call fed the persisted provider = restart simulation)
host suite (real VS Code extension host):
  ✔ palette command delivers stdin and displays clean results via watcher
  ✔ palette command delivers stdin and displays noisy results via watcher
  ✔ manual prompt including its tail matches the pre-feature baseline
  ✔ palette command delivers stdin and displays preset results via watcher (1296ms)
  4 passing (4s) — Exit code: 0
```

Full raw log: `full-run.log` (this directory).

Covers the 2026-11-18 QA unblock item 1: working-display run of the full suite, with the
multi-provider-persists-across-restart behavior asserted by the node fixture above.
Screenshots: `screencapture` is TCC-denied to this host shell (same denial class the owner
already ruled on for #4); the host e2e output above is the captured proof.
Item 2 (native Windows execution) remains open — needs Windows hardware or an owner waiver.
