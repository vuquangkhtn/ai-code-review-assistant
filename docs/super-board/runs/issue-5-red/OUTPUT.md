# Owner red-phase evidence — #5 single-run lock @ ddc4072 (main)
Run: `git apply issue5-lock-tests.patch && npm ci && npx tsc && CLI_REVIEW_TEST=1 CLI_TEST_VSCODE=<installed 1.146.x> node ./out/test/runTest.js` — real extension host, Node 20.19.4, 2026-11-19 (owner session; lane sandbox cannot launch the host)

```
5 passing (3s)   — all pre-existing tests stay green
3 failing        — single-run lock refuses generation and releases after finish / cancel / fail
  AssertionError: The expression evaluated to a falsy value: 'slow fixture has received its prompt' (see host-red.log)
Exit code: 1
```

Red for the right reason: without a lock, the second `runCLIReview` while one runs re-generates the
changes file instead of refusing, so the refusal assertions fail. Tests: the builder's draft patch
(draft saved by wave-5 builder at /tmp/issue5-lock-tests.patch, applied verbatim).
Green run will be supplied owner-session-side after implementation, same recipe.
