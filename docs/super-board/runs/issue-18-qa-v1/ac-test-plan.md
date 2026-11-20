# QA test plan — issue #18 (PR #28), v1

Scope: Builder diff `ae72b45` (PR #28 files: `src/extension.ts`, `src/test/node/branchReview.cjs`, `src/test/suite/cliReview.test.ts`, `src/test/fixtures/review.cjs`, `FEATURES.md`; 254 additions / 68 deletions over main `822ac16`).

## Environment and screenshot fallback (mandatory disclosure)

This card's environment has no interactive display session for driving a modal VS Code QuickPick, and the QuickPick boundary is exactly what AC1 asks about: the two harnesses replace `showQuickPick` with a scripted stub and resolve picks in under 300 ms, so there is no live picker to photograph. **No screenshot was captured and none was fabricated.** Per run.md the fallback evidence is committed here and pins the same observables a screenshot would show — the picker script itself (step titles, placeholders, `(current)` marking, offered branches, pick values) is asserted by both harnesses, and the committed logs are that proof (`test-cli-node.log`, `vscode-suite-cli-subset.log`).

Two environmental facts about the VS Code suite on this host, discovered and worked around during this run (worth recording for later lanes):

1. Full `npm test` mode opens `test-examples/`, which does not exist in a clean clone (not gitignored, absent on disk) — the `assert.ok(workspace)` failures in the Builder handoff.
2. Full `npm test` mode **from a `.claude/worktrees/issue-18-qa` path** dies at VS Code startup: `Error: listen EINVAL: invalid argument .../user-data/1.14-main.sock` — the IPC socket path exceeds the 103-character macOS unix-socket limit. Product code is not involved.

Workaround used for first-hand suite evidence: a shallow detached worktree at `/tmp/issue-18-qa-suite` (same commit `ae72b45`, shared `node_modules`, copied `out/` + `dist/`), running the documented `CLI_REVIEW_TEST=1` subset (`FEATURES.md:326`) with `CLI_TEST_VSCODE` pinned to the already-downloaded binary. **Result: 14 passing, 0 failing**, including all four new cases. The main QA worktree was never edited by this workaround.

## One observable test per AC

| AC | Observable test | Evidence | Verdict |
|---|---|---|---|
| AC1 Compare-Branches CLI run shows the same two-step base/target QuickPick (same default resolution, "(current)" marking) | Real git repo (main + target branches), compiled extension activated with injected vscode stub, `aiCodeReview.runCLIReview` executed: exactly 2 picks, titles `Compare Branches - Step 1/2: Select Source Branch` / `Step 2/2: Select Target Branch`, step-1 placeholder contains `default: main`, `main` carries `(current)`, `main` absent from the step-2 list | `src/test/node/branchReview.cjs:27-34` (`assert.match(options.title, /Step ${picks}\/2/)` `:27`, `(current)` + `default: main` `:29-30`, target-list exclusion `:34`, `picks===2` `:78`); same script asserted against `review-base`/`review-target` in the real VS Code host (`vscode-suite-cli-subset.log` → `CLI review uses selected changes: branch`); single implementation: the manual flow's inline picker was extracted verbatim into `selectComparisonBranches` (`src/extension.ts:87-158`) and `copyPromptCompareBranches` now calls it (`src/extension.ts:321-322`) — no second implementation exists in the diff | PASS |
| AC2 CLI prompt + changes file built from the branch comparison, target-checkout parity with copy-prompt flow | Fixture CLI receives the branch prompt, the referenced changes file parses with `type: 'branch'`, `source: 'main'`, `target: 'target'`, first file diff contains the target-only content `const sample = 18`, and the working branch after the run is `target` (checkout happened before collection) | `src/test/node/branchReview.cjs:80-85` (prompt regex → changes file `:80`, type/source/target `:81-83`, `git branch --show-current` === `target` `:84`, diff content `:85`); suite case mirrors it (`changes.source === 'review-base'`, `changes.target === 'review-target'`, checked out to review-target) in `vscode-suite-cli-subset.log`; parity: both flows call the same helper — CLI passes `allowCheckout: () => !controller.signal.aborted` (`src/extension.ts:155`), copy-prompt passes `() => !refuseDuringCLIReview()` (`src/extension.ts:321`), checked at the same point in the flow (after both picks) as the pre-change inline code | PASS |
| AC3 Local Changes type unchanged — no branch prompts | Same run with `defaultChangeType: local`: 0 QuickPicks, prompt is the local prompt, changes file `type: 'local'` | `src/test/node/branchReview.cjs:78,81` (`picks === 0` for local, `changes.type === 'local'`); `collectCLIChanges` routes anything not `branch`/`commit` to `detectAndStoreLocalChanges` (`src/extension.ts:150-153`); suite case `CLI review uses selected changes: local` (0 picks, type local) in `vscode-suite-cli-subset.log` | PASS |
| AC4 Dismissing either QuickPick aborts cleanly: no run, no working-tree change, status idle | cancel-base (dismiss step 1) and cancel-target (dismiss step 2): no `received-prompt.txt` (fixture CLI never started), current branch still `main`, `setCLIStatus` observed `{ kind: 'idle' }`, no `.ai-code-review/changes` written, and a follow-up local run succeeds (run lock released); checkout-fail: uncommitted local work `local work to preserve` still verbatim in `sample.js`, branch unchanged, idle | `src/test/node/branchReview.cjs:68-76` (no prompt file, branch, idle, changes-dir absence, preserved content `:72`, lock-release re-run `:74-76`); suite cases `cancel-base`/`cancel-target` in `vscode-suite-cli-subset.log` assert the same plus `picks === 1/2`; mutation check proves these tests fail when the idle guard is dropped (`mutation-check.log`: 2 pass / **3 fail** on mutant, 5/0 restored; `tsc` also rejects the mutant with TS18048) | PASS |
| AC5 e2e test: branch-type CLI run receives a branch-comparison prompt; local-type run unchanged | Tests 1–2 of the node e2e exactly: branch run's captured prompt → branch changes file (source/target/diff/checkout asserted); local run's captured prompt → local changes file, 0 picks | `src/test/node/branchReview.cjs` tests `registered CLI command selects branch changes` / `... local changes` (ok 1–2 in `test-cli-node.log`); duplicated at the real VS Code host for the scripted-UI path (`vscode-suite-cli-subset.log`) | PASS |

## Test-gap ledger (AC → asserting rung)

| AC | Unit / real-process node | Component (VS Code host) | e2e |
|---|---|---|---|
| AC1 | `src/test/node/branchReview.cjs:27-34` | `src/test/suite/cliReview.test.ts:40-53` (scripted picker, real command/detector/CLI) | n/a — modal QuickPick, no display |
| AC2 | `src/test/node/branchReview.cjs:80-85` | `src/test/suite/cliReview.test.ts:59-66` | n/a |
| AC3 | `src/test/node/branchReview.cjs:78,81` | `src/test/suite/cliReview.test.ts:57-58` | n/a |
| AC4 | `src/test/node/branchReview.cjs:68-76` | `src/test/suite/cliReview.test.ts:54-57` | n/a |
| AC5 | tests 1–2 of `branchReview.cjs` | suite cases 1–2 | n/a (the node e2e **is** the e2e rung) |

## Edge cases examined

Pinned by tests: source branch excluded from the target list; default source resolution (`default: main` in a fresh repo with no remotes); `(current)` marking; dismissal at each step (1 pick vs 2 picks); checkout failure preserves uncommitted work verbatim; run-lock release after cancellation (follow-up run succeeds); invalid `defaultChangeType` values fall through to local (same observable as pre-change CLI behavior, which never read the setting).

Gaps (not written — recorded in handoff, none High):

1. **`defaultChangeType: 'commit'`** routes the CLI run through the branch picker (parity with `copyPrompt`'s commandMap, `src/extension.ts:176-180`) but no harness covers commit type (medium — non-default config, partly covered branch).
2. **`< 2 branches` guard** (`src/extension.ts:90-94`): shows the error and returns undefined → idle, but is untested for the CLI path (low-medium — error path; the checkout-failure error path is tested).
3. Fixture loosening note: `src/test/fixtures/review.cjs:11` now asserts JSON shape (`files` array) instead of `/sample.js/` — necessary because the fixture serves both prompt types; per-test assertions on `type`/`source`/`target`/diff content compensate in both harnesses.

## Test the tests

Both harnesses assert real outcomes (files on disk, `git branch --show-current`, parsed changes JSON, captured prompt text), not their own mocks; the vscode stub only replaces the UI boundary the ACs name. Mutation check (`mutation-check.log`): deleting the `(!changes) → idle` guards turns cancel-base/cancel-target/checkout-fail red (status would be `failed` via the thrown TypeError, not `idle`) and strict mode itself rejects the mutant (TS18048) — no surviving mutant found for the guarded behavior. Restored after the check; the mutation never reached a commit (`git status` clean apart from the evidence directory).

## Run record (this host, darwin arm64)

- `npm ci --silent` — exit 0 (prepare → package → compile ran clean)
- `npm run check-types` — exit 0 (`check-types.log`)
- `npm run lint` — exit 0, 0 errors, 67 warnings (all pre-existing, same count as the #17 QA run) (`lint.log`)
- `npm run compile` — exit 0 (`compile.log`)
- `npm run test:cli` — exit 0, **41 tests: 40 pass, 1 platform-skip (Windows shim), 0 fail** — matches the Builder's numbers (`test-cli-node.log`)
- `CLI_REVIEW_TEST=1` VS Code suite from the shallow `/tmp` worktree — **14 passing, 0 failing**, including the 4 new cases (`vscode-suite-cli-subset.log`)
- mutation check — mutant 2 pass / 3 fail; restored 5 pass / 0 fail (`mutation-check.log`)
