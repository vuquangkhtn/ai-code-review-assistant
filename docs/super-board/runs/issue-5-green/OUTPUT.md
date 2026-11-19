# Owner green-phase evidence — #5 single-run lock @ 9549109 + test-expectation fix
Run: `npm ci && npx tsc && CLI_REVIEW_TEST=1 CLI_TEST_VSCODE=<installed 1.146.x> node ./out/test/runTest.js` — real extension host, Node 20.19.4, 2026-11-19 (owner session)

```
8 passing (2s)
  ✔ single-run lock refuses generation and releases after finish (259ms)
  ✔ single-run lock refuses generation and releases after cancel (146ms)
  ✔ single-run lock refuses generation and releases after fail  (166ms)
  + all 5 pre-existing tests
Exit code: 0
```

Red→green chain: clean red @ 11aaced (3/3 failing at the refusal assertion) → builder lock
f5c5563 → this green run. Test-expectation fixes made during evidence runs (lock assertions
untouched): (1) changes-file reads resolve workspace-relative prompt paths via path.join;
(2) the post-release clipboard check now accepts the file-based-prompt notice and matches
/Changes File/ inside the prompt file it names — PromptGenerator routes ANY changed-files
request to the file-based prompt, so the raw prompt never reaches the clipboard in this
workspace. Raw log: `host-green.log`.
