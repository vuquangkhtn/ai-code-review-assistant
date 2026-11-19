# Issue 4 QA v2

Reviewed application head: 8f2892168e04b0338ce44aa5e1519cd39b75e1cd.

`npm ci --silent && npm run check-types && npm run lint && npm run test:cli && npm run compile` passed. Lint: 0 errors, 64 warnings. Process fixtures: 9/9 passed, including live stdout before exit, PID death on cancel, no result after cancellation and bounded stderr tail.

`CLI_REVIEW_TEST=1 CLI_TEST_VSCODE='/Applications/Visual Studio Code.app/Contents/MacOS/Code' node out/test/runTest.js` failed:

```
Exit code: SIGABRT
Failed to run tests TestRunFailedError: Test run terminated with signal SIGABRT
```

`screencapture -x /private/tmp/issue-4-qa-display.png` failed:

```
could not create image from display
```

Owner evidence at https://github.com/vuquangkhtn/ai-code-review-assistant/pull/7#issuecomment-6929995518 reports 5/5 extension-host tests passing at the same application head. This clears the prior claim that no host has executed those tests; it does not supply screenshots or a dedicated-channel assertion.

| AC | Evidence and remaining gap |
|---|---|
| Tree starts run | Host test checks command mapping; owner reports passing. Rendered tree screenshot absent. |
| Running/done/failed and stderr | Tree unit test sets states manually; process test verifies stderr tail. Runner-driven tree and failure-toast observation absent. |
| Dedicated channel live stdout | Process callback test passes. No assertion reads the dedicated output channel while the process is alive. High gap remains. |
| Cancel kills and clears | POSIX process PID death verified; owner host cancellation passes. Host test does not assert status clear or PID death. |
| Custom command without preset | Owner host fixture and local process fixtures pass. |

Independent source review: extension.ts wires append, status, cancel and failure details; no confirmed application defect found. All 12 existing author notes were read, including replies; no qa finding threads require resolution.

Truth check: 60/100 for complete UI acceptance, below configured 70. Owner evidence is credited; live output, runner-driven states and screenshots remain unproved. Do not merge from the QA lane.

Test gaps not written: High dedicated-channel live assertion (desktop host unavailable); Medium runner-driven tree/status, double-submit, timeout, Windows taskkill; Low focus/layout.

Blocked on a working desktop capture/test session. Capture working tree/output/cancel/failure at 1920×1080, 1024×768 and 375×667. Add and run the live-channel assertion red-first, then return to QA. No application source changed.
