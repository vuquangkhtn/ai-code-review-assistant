# Owner host evidence — PR #14 @ 86eec52 + baseline-pin fix
Run: `npm ci && npm run check-types && npm run lint && node --test src/test/node/*.cjs && npx tsc && CLI_REVIEW_TEST=1 CLI_TEST_VSCODE=<installed 1.146.x> node ./out/test/runTest.js` — real extension host, Node 20.19.4, 2026-11-19 (owner session)

```
check-types: clean   lint: 0 errors / 66 warnings
node fixtures: 27 — 26 pass, 1 platform skip, 0 fail
host suite (real extension host): 9 passing, Exit code 0
  incl. tree run/cancel/failure, custom-command cancel, tracer clean+noisy+preset delivery,
  single-run lock × 3 (finish/cancel/fail refuse + release + recovery)
```

Baseline pin update (this commit): the pre-feature prompt hash moved intentionally — #11 adds the
confidence/evidence request to both manual and CLI prompt sections (verified: that 5-line delta is the
ONLY prompt diff vs main; any other drift still fails the pin). Screenshots: TCC-denied on this host
(owner ruling class, see #4/#3); the host e2e output above is the captured proof per the standing
evidence protocol.
