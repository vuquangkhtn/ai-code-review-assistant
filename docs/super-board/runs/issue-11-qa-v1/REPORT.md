# Issue 11 QA v1

Reviewed head: b8ba1e3c52c1b2eded1c4fceb24b3c5c5d5c2b1b against origin/main.

Result: blocked on live UI verification. No application defect found by inline independent standards/spec review. No prior review findings existed. No merge attempted: merging belongs to Reviewer.

## Acceptance ledger and test-gap check

| AC | Unit / Node proof | Component proof | Live extension / e2e |
|---|---|---|---|
| Optional types and prompt fields | `reviewContract.cjs:92` plus check-types | n/a: contract | n/a: type contract |
| Preserve supplied fields and legacy compatibility | `reviewContract.cjs:37`, `:44`, `:52` | n/a: parser | none: host aborts |
| Confidence label and absent-field tolerance | `reviewContract.cjs:62` | `reviewContract.cjs:72` runs production panel script | none: VS Code SIGABRT; browser launch denied |
| Node fixtures for parse and render | `reviewContract.cjs:37–104`; 26 passes / 1 Windows-only skip | same production renderer fixture | n/a: explicitly Node fixtures |

All ACs have behavioral assertions. No High test gaps requiring application changes found. Medium gaps not written: full DOM/layout and live VS Code integration; resolved confidence description; empty evidence and Unicode/long evidence boundaries. Optional invalid values (`certain`, null, number, object) and all three valid levels are pinned. Auth, money, dates, pagination, races: n/a, no relevant changed branches. Existing tests call the actual parser/tree/panel script; VS Code host APIs are stubbed. The evidence escaping assertion does not prove evidence renders: evidence is preserved but not displayed, which matches this slice's requested confidence display.

## Commands and observed results

- `npm ci --silent && npm run check-types && npm run lint && npm run test:cli`: exit 0; 26 passed, 1 Windows-only skipped; 66 lint warnings, zero errors.
- `npm test` after TypeScript emission: VS Code 1.147.0 downloaded; SIGABRT before test suites ran.
- `CLI_TEST_VSCODE='/Applications/Visual Studio Code.app/Contents/MacOS/Code' node out/test/runTest.js`: installed host also SIGABRT.
- `QA_PLAYWRIGHT=<playwright-core-module> QA_CHROMIUM=<cached-chromium-executable> node docs/super-board/runs/issue-11-qa-v1/render.cjs`: Chromium SIGTRAP; `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`.

Screenshots not captured: both real extension host and browser renderer cannot launch in this restricted execution context. No fabricated UI proof. Browser script retained for a host that permits launch; it uses actual panel HTML and a stubbed host bridge, and cannot substitute for live extension QA.

Truth check: 75/100 for contract/parser/fixture claims; visual AC remains unchecked. Do not advance to Review until live confidence/legacy layout and screenshots are verified on an unrestricted host at 1920×1080, 1024×768, and 375×667.
