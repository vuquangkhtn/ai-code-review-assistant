# QA evidence — issue #38 · v1 · 2026-11-21

Branch `issue-38-cli-review-stuck-running` @ `374a84e` · worktree `/tmp/sb38qa` (short path —
deliberate: the default worktree path overflows the 103-char IPC socket limit and the VS Code
test host fails with `listen EINVAL`).

## Commands

```
npm run compile                     # check-types + esbuild → 0 errors
npm run lint                        # 0 errors (71 pre-existing warnings)
npm run test:cli                    # node lane: 78 tests, 77 pass / 0 fail / 1 skipped
npx tsc                             # emit out/ for the VS Code lane
CLI_REVIEW_TEST=1 node /tmp/sb38qa-runner/run-qa.cjs            # branch integration lane
CLI_REVIEW_TEST=1 node /tmp/sb38qa-runner/run-main-baseline.cjs # main baseline (c152c52)
```

Runner = `src/test/runTest.ts` invocation + short `--user-data-dir`; `CLI_REVIEW_TEST=1`
scopes `src/test/suite/index.ts` glob to `cli{Review,Status,Comparison}.test.js`.

## Results

| Lane | Branch 374a84e | main c152c52 | Delta |
|---|---|---|---|
| node (`npm run test:cli`) | 77 pass / 0 fail / 1 skip | n/a (pure-node, no VS Code host) | — |
| VS Code integration (scoped) | **9 pass / 9 fail** | 5 pass / 9 fail | +4 pass (the new tests) |

The 9 integration failures are **identical sets on main and the branch** — same tests, same
file:line (`cliReview.test.js:105/106/98/166`, `cliComparison.test.js:59`, and the
`single-run lock … after fail` timeout in `cliStatus.test.js`). Mechanism: that one pre-existing
test stubs `showWarningMessage` but not the failure modal, so the real
`showErrorMessage` dialog never resolves in the test host, its run promise never settles,
`cliRun` stays set, and every later run command is refused by the single-run lock
(tracer/comparison fixtures never receive their prompt). Pre-existing, untouched by this PR.

## AC → test ledger (issue-scoped)

| AC | Asserting test (src/test/suite/cliStatus.test.ts) | Rung | Status |
|---|---|---|---|
| AC1 terminal status on every exit path incl. provider-selection failure | :58 `provider not on PATH … row settles` (row not `cliReviewRunning`, re-run command, error icon, failure tooltip); :108 `no CLI on PATH … row settles`; :188 `row settles even when the failure render itself fails` (finally guard); :144 live-run abort → idle; :295-382 pre-existing lock release after finish/cancel/fail | integration | ✅ pass |
| AC2 failure dialog offers switch (routes to `aiCodeReview.selectCLIProvider`) and/or settings | :90-94 asserts `Switch CLI Provider` action + quickpick placeholder `Select the CLI provider for AI reviews` + detected alternative listed; :131 asserts exact `['Show Output', 'Open Settings']` when no CLI is detected | integration | ✅ pass |
| AC3 `cancelCLIReview` self-heal, live run keeps confirm-to-stop | :144-186 stale row heals with no stop dialog → row re-runnable (`play` icon); live fixture run shows `Stop the running review` confirm and settles idle after abort | integration | ✅ pass |
| AC4 coverage in `src/test/suite/` | 4 new tests at :58, :108, :144, :188 | — | ✅ pass |

## Edge cases checked

- **Pinned** — failure with NO alternative provider detected → Open Settings offer (:131).
- **Pinned** — stale `running` row while a run is actually live is NOT clobbered: the heal
  fires only under `if (!run)` (src/extension.ts:211-217); a live run gets the confirm dialog (:171-174).
- **Pinned** — switch routing reaches the real `selectCLIProvider` quickpick with the detected
  alternative in its items (:92-94).
- **Pinned** — `failed` render throwing cannot wedge the row in `running` (:188, finally guard).

## Test-the-tests (mutation checks)

- Recovery gate mutant `cliAttempted || attemptedProvider` → `cliAttempted`: test :58 fails
  (no dialog offered). Surviving-mutant check OK.
- `finally` guard mutant dropping the `running` check: test :188 fails (row stays running).
  Unconditional-idle mutant: test :58 fails (row would lose the `failed` error icon/tooltip). OK.
- Heal mutant (no reset): test :144 fails. Heal-on-any-status mutant (would wipe a `failed`
  row via palette cancel): not caught — palette-only path, row click target in `failed` state
  is `runCLIReview`, so not user-reachable. LOW.
- Recovery tests assert on the real captured `CodeReviewTreeProvider` state, not their own mocks.

## Test gaps (not written)

- MEDIUM — `Open Settings` routing to `workbench.action.openSettings('aiCodeReview.cli')` is
  offered (:131) but not exercised (test :108 dismisses the dialog). Routing block is shared
  with the exercised `Switch CLI Provider` route.
- MEDIUM — the full loop "fail → switch to a detected provider → rerun succeeds" is not
  exercised end-to-end (test :58 cancels the quickpick); rerun-after-failure itself is covered
  by the pre-existing lock `fail` release test.
- LOW — `aiCodeReview.compareCLIReviews` provider-selection errors share the same catch/finally
  (terminal row) but have no dedicated test.

None are HIGH: every AC has an asserting test at the integration rung; no auth/money/security/
data-loss surface. No app-code changes needed.

## Verdict

**PASS** — 4/4 ACs verified. Branch introduces no regressions: failing set is byte-identical
to the main baseline; passing set grows by exactly the 4 new recovery tests.

Non-visual change (dialog actions + row status machine, verified via the test host) —
screenshot table intentionally omitted; evidence = this folder.
