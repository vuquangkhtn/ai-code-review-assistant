# Issue 12 QA, round 1

Result: blocked by native host launch, not a confirmed product defect.
Reviewed head: 9799098ce3434cbffc1e8dc62de8bf6af54da034.
PR: https://github.com/vuquangkhtn/ai-code-review-assistant/pull/15

## Checks

- `npm ci --silent`: exit 0.
- `npm run test:cli`: exit 0; 30 passed, 1 existing skip, 0 failed.
- `npm run check-types`: exit 0.
- `npm run lint`: exit 0; 0 errors, 66 existing warnings.
- `npm run compile`: exit 0.
- `git diff --check`: exit 0.
- `CLI_TEST_VSCODE='/Applications/Visual Studio Code.app/Contents/MacOS/Code' npm test`: exit 1, `Test run terminated with signal SIGABRT` before extension-host test execution. The app bundle contains Code, not Electron; an earlier Electron-path attempt returned ENOENT.
- Cached runtime fallback: exit 1, ENOENT. Main checkout `.vscode-test/vscode-darwin-arm64-1.146.0/` contains only `is-complete`, no executable.
- macOS crash record `Code-2026-11-19-225449.ips`: EXC_CRASH / SIGABRT; Abort trap: 6; `abort() called`. This proves a host-launch failure, not its root cause.

## Acceptance ledger

| AC | Unit | Component | Native host | Result |
|---|---|---|---|---|
| Setting registered, default off, docs updated | Direct package.json contribution inspection: enum off/critical/high, default off | FEATURES.md Severity policy section | Not needed for static registration | Pass |
| Critical flags tree and panel; lower findings unchanged | severityPolicy.cjs threshold matrix | reviewContract.cjs tree and actual webview script assertions | Not run: host abort | Partial; visual proof pending |
| Default off preserves display/behavior | severityPolicy.cjs off matrix | reviewContract.cjs legacy labels, hidden summary and absent Blocking text | Not run: host abort | Partial; visual proof pending |
| Node fixtures cover boundaries | severityPolicy.cjs all severities across off/critical/high, invalid values, empty count | reviewContract.cjs filter retention and off transition | n/a: explicitly Node criterion | Pass |

Paths in the ledger are under src/test/node/. Tests use real parser, provider and webview script, with only the VS Code API stubbed. They are not native host evidence.

## Independent review and test gaps

Read all nine changed files against origin/main, issue criteria, builder handoff, and all ten PR review comments (nine author file notes and one inline note; no findings or human requests). No confirmed code defect. No prior reviewer findings to recheck.

Threshold equality, lower severities, invalid config and empty summaries are covered. Shared threshold functions keep both views consistent. The configuration listener refreshes both views; the panel retains its active severity filter. Saved issues are copied before display flags are added. Resolved findings are intentionally counted, as documented.

High verification gap: actual native tree/panel rendering and default-off appearance remain unverified. No product change is justified by a host startup abort. Screenshots at 1920x1080, 1024x768 and 375x667 were not captured because neither native runtime launched. No screenshot is implied by markup tests.

Test gaps (not written): medium, native settings-event refresh and high-threshold view rendering; current component fixtures cover critical and off transitions and pure fixtures cover high. Loading/error/auth/money/date/race cases are not new branches in this display-only change.

Truth check: 65/100, below configured 70. Static and fixture behavior pass; visual criteria cannot be signed off. Re-run on a working desktop extension host, capture both views at required viewports, and inspect default off before returning to Review. QA does not merge.
