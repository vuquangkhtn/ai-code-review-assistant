# Owner red-phase evidence — #5 single-run lock @ ddc4072 (main), clean red
Run: `git apply issue5-lock-tests.patch && npm ci && npx tsc && CLI_REVIEW_TEST=1 CLI_TEST_VSCODE=<installed 1.146.x> node ./out/test/runTest.js` — real extension host, Node 20.19.4, 2026-11-19 (owner session; lane sandbox cannot launch the host)

```
5 passing (2s)  — all pre-existing tests stay green
3 failing       — single-run lock refuses generation and releases after finish / cancel / fail
  AssertionError: runCLIReview   (out/test/suite/cliStatus.test.js:137 — the refusal assertion:
                                  /CLI review is running.*cancel it first/i never matches, lock absent)
Exit code: 1
```

Red for the right reason: every failing assertion is the missing refusal. Builder note: the draft
patch's two `fs.readFileSync(changes[1])` calls used the workspace-relative prompt path verbatim and
failed ENOENT before reaching the refusal; they now resolve via `path.join(workspace.uri.fsPath, …)`
(assertions unchanged). Log excerpt: `host-red.log`; full raw log is preserved at commit `11aaced`. First (pre-fix) run preserved in git history of this
file at f814c77. Green run will be supplied owner-session-side after implementation, same recipe.
