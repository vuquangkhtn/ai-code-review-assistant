# QA v2 — issue #41 rebuild: stabilize the `finish` lock test (R1)

Reviewer R1 (PR #43 round 1): `src/test/suite/cliStatus.test.ts:352` — the `finish` lock
test flaked 1-in-5 in reviewer reruns (`assert.ok(changes)`: the fixture prompt lacked
`Changes File:**`; runs 2–5 were 18/0). Pre-existing since `c2febe15`, test-side, on a file
this PR touches — QA owns the fix.

## Root cause

- The lock tests write a custom fixture that stores the CLI prompt it receives into
  `lock-started.txt`, then the test polls `fs.existsSync(marker)` and reads the file on
  first sight.
- The fixture stores the prompt with one `fs.writeFileSync` — create, write, close. That
  sequence is not atomic for a concurrent reader: a test that observes the file between
  create and write reads an empty or partial prompt, so the `Changes File:**` match
  returns null and `assert.ok(changes)` fails.
- On a quiet machine the create-to-write gap is microseconds (a 4000-run parent/child
  micro-experiment caught 0 races). Under reviewer-machine load the fixture process can be
  descheduled inside that gap for milliseconds — comparable to the 50 ms poll interval,
  which is the 1-in-5 rate class.
- The prompt builder is NOT at fault: `generateFileReferencePrompt(..., 'cli')`
  (`src/ai/PromptGenerator.ts:318`) always emits `**Changes File:** \`<path>\``, and the run
  command passes that prompt to stdin verbatim (`src/ai/CLIReview.ts:127`). A complete
  prompt always matches. Non-local `defaultChangeType` modes were ruled out: they either
  spawn no CLI (assert at line 349 would fail first, not 352) or still build the same
  marker prompt.

## Fix (test-side only — `src/test/suite/cliStatus.test.ts`, shared by finish/cancel/fail)

The wait loop now polls the marker CONTENT until the `Changes File:**` pattern is present
(same 10 s deadline) instead of reading on first `existsSync`. The assertion is unchanged
and not weakened — a prompt without the marker still fails; the message now reports how
many bytes were read for future diagnosis.

## Flake rate

| Phase | Scope lane (`CLI_REVIEW_TEST=1 node ./out/test/runTest.js`) | Result |
|---|---|---|
| Before (reviewer) | reviewer reruns, their machine | 1 red / 5 runs |
| Before (QA repro) | 6 runs normal load + 6 runs under 8-way CPU load | 0 red / 12 runs (not reproduced locally) |
| After (fix) | 10 consecutive runs, this worktree | **10 × 18 passing / 0 failing, exit 0** (`scoped-run1..10.log`) |
| After (long path) | 1 run from `.claude/worktrees/issue-41-qa2` (77-char path) | 18 passing / 0 failing |

## Other gates

- `npm run test:cli` — 77 pass / 0 fail / 1 skip (`unit-run.log`)
- `npm run compile` — exit 0 (`compile.log`)
- `npm run lint` — exit 0, 0 errors, 71 pre-existing warnings (`lint.log`)

## Notes for the Reviewer

- The lock assertions (refuse-loop, dialog counts, release behavior) are untouched; the
  only change is the wait-loop completeness condition and the assert message.
- Not reproducible on the QA machine (12 green pre-fix runs) — the determinism argument
  rests on the code path analysis above, not on a caught red. The fix removes the only
  identified way line 352 can fail with line 349 passing.
