# QA test plan — issue #17 (PR #26), v1

Scope: Builder diff `76162e7` (PR #26 files: `src/ai/CLIReview.ts`, `src/extension.ts`, `src/test/node/cliProgress.cjs`, `src/types/index.ts`).
Environment: headless host, no GUI/display — no live VS Code window can be opened. Screenshot capture is not possible; per run.md the fallback is documented here and alternative evidence is committed alongside. No screenshot was fabricated.

## One observable test per AC

| AC | Observable test | Evidence | Verdict |
|---|---|---|---|
| AC1 header on run start (command, review type, file list, total) | Real-process run of `runCLIReview` with `review` option: the first `onStdout` chunk (channel chunk[0]) contains `=== CLI review ===`, `Command:`, `Review type: local`, the full file list and `Total files: 3`, and arrives before any provider output | `test-cli.log` test 10 asserts `/Command: .*node/`, `/Review type: local/`, file-list regex, `/Total files: 3/` and `chunks[0]` matches `/Total files: 3/`; `channel-capture.txt` shows chunk[0] is the complete header | PASS |
| AC2 provider stdout appended as it arrives | Partial mid-stream chunk `Reviewing index.ts src/a/ind` is delivered as its own `onStdout` call while the process is still running; lifecycle test asserts stdout visible before exit | `test-cli.log` test 10 `chunks.includes('index.ts src/a/ind')` (partial chunk delivered live); test 1 `stdout arrives before exit...` asserts output non-empty while fixture runs; `channel-capture.txt` AC2 section lists chunk boundaries | PASS |
| AC3 visible "reviewed X/N files" updates; counts via path or unambiguous basename | Progress sequence `[0,1,2,3]` observed during the run; channel contains `[progress] reviewed 3/3 files`; split path (`src/a/ind` + `ex.ts`) counted once; ambiguous basename `index.ts` ignored; `src/b/index.tsx` does not miscount `src/b/index.ts` (a wrong match would yield `[0,1,3,3]`) | `test-cli.log` test 10 asserts `progress.map(p => p.reviewed)` deep-equals `[0,1,2,3]` and channel matches `/\[progress\] reviewed 3\/3 files/`; `channel-capture.txt` shows each increment and its trigger chunk | PASS |
| AC4 progress exposed via CLI run status | `onProgress` receives `{ reviewed, total }` payloads in order; extension wiring forwards them into `setCLIStatus({ kind: 'running', progress })`; `CLIReviewStatus.running` carries `progress?` | `channel-capture.txt` AC4 section records payloads `[{0,3},{1,3},{2,3},{3,3}]`; wiring inspected at `src/extension.ts:166` and `src/extension.ts:191`; type at `src/types/index.ts:110-112`; tree consumes status via `CodeReviewTreeProvider.setCLIStatus` (`src/ui/CodeReviewTreeProvider.ts:12`) | PASS |
| AC5 progress/header output visually separated from provider output | Exact interleaved channel text captured from a real run: header block opens with `=== CLI review ===`, every progress line is bracketed by `[progress] reviewed X/N files` and a `--- provider output ---` delimiter, provider text stays raw | `channel-capture.txt` (committed) reproduces the exact output-channel text in arrival order | PASS (see handoff note: delimiter strings themselves are not asserted by an automated test) |
| AC6 bookkeeping: counted on path appearance, never exceeds total, no double-count | Duplicate input paths dedupe to total 1; counter per provider restarts at 0; set-backed counting makes repeat mentions count once; observed sequences never exceed total | `test-cli.log` test 11: two providers each observe `[{0,1},{1,1}]` from input `['src/file.ts','src/file.ts']`; test 10 sequence `[0,1,2,3]` against total 3 | PASS |

## Test-gap ledger (AC → asserting rung)

| AC | Unit / real-process | Component | e2e |
|---|---|---|---|
| AC1 | `src/test/node/cliProgress.cjs:27-31` | none — extension wiring (`src/extension.ts:164-166`) is extension-host code; no display here | n/a — VS Code UI |
| AC2 | `src/test/node/cliProgress.cjs:33-34`; `src/test/node/cliLifecycle.test.cjs:20` | none | n/a |
| AC3 | `src/test/node/cliProgress.cjs:24,32` | none | n/a |
| AC4 | `src/test/node/cliProgress.cjs:25`; capture payloads | `src/extension.ts:166,191` (inspection only) | n/a |
| AC5 | delimiters produced at `src/ai/CLIReview.ts:29,53`; asserted only indirectly (line formats pinned); visual proof via `channel-capture.txt` | none | n/a — no display |
| AC6 | `src/test/node/cliProgress.cjs` tests 10-11 | none | n/a |

## Edge cases examined

- Pinned by tests: split paths across stream chunks (accumulated output is scanned, `src/ai/CLIReview.ts:86-88`); ambiguous basenames ignored (`cliProgress.cjs` sequence would become `[0,2,…]` if the uniqueness check were dropped); prefix collision `index.tsx` vs `index.ts` (wrong match would yield `[0,1,3,3]`); duplicate input paths (Set dedupe → total 1); per-provider reset (fresh `reviewed` per call); trailing token at process end (`final` lookahead, `src/ai/CLIReview.ts:33-36`).
- Gaps (not written): the literal delimiter strings `=== CLI review ===` / `--- provider output ---` are not asserted by any automated test (medium, low impact — line formats are pinned); empty `review.files` list produces `Total files: 0` with no test (low — extension always passes ≥1 file); Windows backslash normalization of provider output is untested on this host (low).
- Saved-JSON purity: header/progress text goes to `onStdout` only, never into the resolved stdout, so `extractReviewJSON` output stays annotation-free; existing parser round-trip tests (test 22-25) cover saved content.

## Test-the-tests

`cliProgress.cjs` runs the compiled implementation (`out/ai/CLIReview`) against a real `node -e` subprocess; assertions are concrete sequences and regexes, no self-referential mocks. The `live` flag asserts progress arrives before `.ai-code-review/results` exists. The suite can fail; no surviving-mutant candidate found for the guarded behavior.

## Run record (this host, darwin arm64, node 20.19.4)

- `npm ci --silent` — exit 0
- `npm run check-types` — exit 0 (`check-types.log`)
- `npm run lint` — exit 0, 0 errors, 67 pre-existing warnings (`lint.log`)
- `npm run test:cli` — exit 0, 36 tests: 35 pass, 1 skip (Windows-only), 0 fail (`test-cli.log`)
- `npm run compile` — exit 0 (`compile.log`)
- `node capture-channel.cjs` — exit 0 (`channel-capture.txt`)

## UI verification fallback (mandatory disclosure)

AC1/AC2/AC5 are output-channel visuals. This host has no GUI/display, so `@vscode/test-electron` cannot open a window and no screenshot exists. Alternative evidence committed here: `channel-capture.txt` reproduces the exact bytes the extension appends to `cliOutput` via `onStdout` (`src/extension.ts:165,166-167` wiring inspected), including chunk order, delimiters and interleaving. The tree view renders `CLI review: running` (`src/ui/CodeReviewTreeProvider.ts:65-74`); it does not yet display the counts — AC4 requires exposure, which the status object now carries.
