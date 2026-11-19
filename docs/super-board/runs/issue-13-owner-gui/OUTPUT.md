# Owner host evidence — PR #16 @ 53e4766
Run: `npm ci && npm run check-types && npm run lint && node --test src/test/node/*.cjs && npx tsc && CLI_REVIEW_TEST=1 CLI_TEST_VSCODE=<installed 1.146.x> node ./out/test/runTest.js` — real extension host, Node 20.19.4, 2026-11-20 (owner session)

```
check-types: clean   lint: 0 errors / 66 warnings
node fixtures: 34 — 33 pass, 1 platform skip, 0 fail
host suite (real extension host): 10 passing, Exit code 0
  incl. the new two-provider comparison flow e2e (two fixture CLIs, same changes, combined view)
```

Covers the builder's host-launch gap at head 53e4766. Screenshots: TCC-denied on this host
(standing ruling class); host e2e output above is the captured proof. Raw log: `host-run.log`.
