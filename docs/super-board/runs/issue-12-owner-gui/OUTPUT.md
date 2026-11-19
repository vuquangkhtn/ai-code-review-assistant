# Owner host evidence — PR #15 @ ea22290
Run: `npm ci && npm run check-types && npm run lint && node --test src/test/node/*.cjs && npx tsc && CLI_REVIEW_TEST=1 CLI_TEST_VSCODE=<installed 1.146.x> node ./out/test/runTest.js` — real extension host, Node 20.19.4, 2026-11-19 (owner session)

```
check-types: clean   lint: 0 errors / 66 warnings
node fixtures: 31 — 30 pass, 1 platform skip, 0 fail
host suite (real extension host): 9 passing, Exit code 0
```

Covers the QA v1 "native host tests" gap at head ea22290 (policy commit 9799098 unchanged since).
Screenshots: TCC-denied on this host (standing ruling class, #4/#3/#11 precedent); the host e2e
output above is the captured proof. Raw log: `host-run.log`.
