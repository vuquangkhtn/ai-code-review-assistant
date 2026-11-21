# QA report — issue #41, PR #43 (v1)

- **Verdict:** PASS — 3/3 AC verified
- **Branch:** `issue-41-integration-baseline` · head at QA time `c948e75`
- **Machine:** macOS arm64 (darwin 25.6.0), VS Code test host `vscode-darwin-arm64-1.147.0`
- **QA worktree (LONG path):** `.claude/worktrees/issue-41-qa` (76 chars; the path class whose launch previously failed with `listen EINVAL` on `main`)

## AC verification

### AC1 — the 9 previously-failing integration tests pass from a long worktree; lock semantics still asserted
- PASS. Scoped integration lane from the long worktree: **18 passing / 0 failing** (`integration-scoped-run1.log`); all three lock suites green:
  - `single-run lock refuses generation and releases after fail`
  - `single-run lock refuses generation and releases after finish`
  - `single-run lock refuses generation and releases after cancel`
- Dialog interaction is asserted, not skipped. The stub (`src/test/suite/cliStatus.test.ts:337-340`) auto-dismisses and records `{message, actions}`; new assertions at `:369-370` (fail ending: dialog shown exactly once, message matches `/CLI review failed: .*exit 7/`) and `:373` (finish/cancel: `deepStrictEqual(failureDialogs, [])`). Stub restored in `finally` (`:394`), so no leakage to other suites.
- Lock assertions untouched: refusal while held (`:355-360`, all five commands refuse with `/CLI review is running.*cancel it first/i` + changes file survives), release after ending (`:366-368`, `/exit 7/` for fail, `undefined` otherwise), recovery after release (`:375-389`, copy-paste works again, fresh CLI generation succeeds).

### AC2 — scoped lane launches and runs green from the LONG worktree path; workaround CWD-independent and documented
- PASS. `CLI_REVIEW_TEST=1 node ./out/test/runTest.js` from `.claude/worktrees/issue-41-qa`: **18 passing, exit 0**, run twice back-to-back (`integration-scoped-run1.log`, `integration-scoped-run2.log`) — the per-run wipe of the tmp user-data dir does not break a consecutive run and leaves no stale lock.
- `src/test/runTest.ts:21-25` pins `path.join(os.tmpdir(), 'ai-code-review-test-host')` — CWD-independent by construction; `fs.rmSync(..., {recursive: true, force: true})` deletes only that one directory (no wildcards, nothing outside it), before every run.
- AGENTS.md bullet matches the implementation verbatim: short CWD-independent `--user-data-dir` under `os.tmpdir()`, wiped before each run, AF_UNIX 103-char rationale.

### AC3 — no existing test weakened; #38 CLI-status suite still passes
- PASS. Diff review (`git diff a9c1535...c948e75`): only 3 files — AGENTS.md (+1 line), `runTest.ts` (+12/-1), `cliStatus.test.ts` (+23/-6). The 6 deleted lines are the replaced comment block and the two-line `if/else` that is kept verbatim inside the new `if/else` (plus its new dialog assertions). No assertion removed or weakened anywhere.
- #38 recovery suite (`CLI review failure recovery (issue #38)`) is green in the scoped 18/18 run.
- Full non-scoped suite from the same long worktree: **102 passing / 17 failing** (`integration-full-run.log`) — same counts the builder measured on baseline `a9c1535`. All 17 failures share the environmental signature `assert.ok(workspace && node)` at `activateWithWorkspace`: `test-examples/` is not tracked in git (verified `git ls-files test-examples` empty) and is absent on this machine, so those suites fail on the missing workspace folder, not on a lock wedge or the diff. Same suites pass in the scoped lane once its temp fixture workspace exists.

## Test-gap check

- Consecutive-run check: scoped lane run 1 → run 2, both 18/18 exit 0. PASS (no stale lock, wipe does not break a second run).
- Wipe containment: by code read (`runTest.ts:21-25`) the wipe target is a single fixed path under `os.tmpdir()`; scoped logs show the fixture workspace (`/var/folders/.../T/cli-review-*`) is a separate `mkdtemp` path wiped in `finally` (`runTest.ts:58`). Nothing outside its own tmpdir is touched.
- Unit lane re-run for stability: 77 pass / 0 fail / 1 skip, twice (initial + `unit-run2.log`). PASS.

**Test gaps (not written, LOW — do not block):**
1. Two concurrent test-host runs on one machine would share `os.tmpdir()/ai-code-review-test-host` and race on the wipe (run A wipes under run B). Needs no app-code change; a run-unique suffix (e.g. `process.pid`) would fix it if it ever bites. LOCAL-only, no shipped-code path.
2. If the wipe fails (dir busy), `runTest.ts:23` silently reuses the prior profile. Path stays short so the launch still works; only stale-profile state could persist. Cosmetic.
3. No test asserts the wipe itself (e.g. that a planted file in the user-data dir is gone after a run). Would be a harness-only test.

## Files

| File | What it shows |
|---|---|
| `integration-scoped-run1.log` | 18 passing, exit 0, from the long worktree (run 1) |
| `integration-scoped-run2.log` | 18 passing, exit 0, consecutive run 2 |
| `integration-full-run.log` | 102 passing / 17 failing (pre-existing missing-`test-examples/` set) |
| `unit-run2.log` | 77 pass / 0 fail / 1 skip (stability re-run) |
| `commands.log` | exact commands and key outputs |
