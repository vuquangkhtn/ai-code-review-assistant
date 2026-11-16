# Issue 4 QA v1 — blocked on desktop verification

Tested implementation: ebb94c39c9421d58532b4a019caac12a7b8162ce.
Base fetched: origin/main (60457bc); PR #7 remains draft. No merge attempted: QA may only advance to Review.

## Result

Node 20.19.4 clean install, typecheck, lint, nine real-process tests and compile pass.
An earlier run on Node 23.7.0 also passed. No live extension-host test passed.
Installed VS Code terminates with SIGABRT before reporting any Mocha result.
Cached VS Code produced no Mocha result and was stopped with Ctrl+C; it terminated with SIGINT.
Screen capture failed: `could not create image from display`.
Desktop 1920×1080, tablet 1024×768, mobile 375×667 and per-AC screenshots: not captured because no test desktop was available.
No visual pass is claimed. All five ACs remain unchecked.

## Observable plan and test-gap ledger

Paths below are relative to the repository; existing host tests were compiled, not executed.

| AC | Unit/process assertion | Component assertion | Extension-host/e2e | Live result |
|---|---|---|---|---|
| 1 tree run starts custom command | cliReview.cjs:10 clean/noisy result | cliStatus.test.ts:11 command mapping | cliStatus.test.ts:43,49 starts custom command; tree click itself untested | unverified |
| 2 running → done/failed and stderr tail | cliLifecycle.test.cjs:31 bounded tail | cliStatus.test.ts:13–21 manually assigned states | none for runner-driven state/toast | unverified |
| 3 live dedicated output | cliLifecycle.test.cjs:8 callback before exit | none for OutputChannel append | none for rendered output | unverified |
| 4 cancel kills process, clears status | cliLifecycle.test.cjs:8 abort/PID death/no result | cliStatus.test.ts:22 manually assigned idle | cliStatus.test.ts:26 cancel/no result; no actual status/PID assertion | unverified |
| 5 custom command, no preset | cliReview.cjs:10 runs fixture shell command | n/a: config used by registered command | cliReview.test.ts:26 clean/noisy; cliStatus.test.ts:26 cancel | unverified |

High AC coverage gap: no dedicated-output-channel assertion at any test rung (a stdout callback assertion is only partial AC3 coverage). Add an extension-host assertion that a sentinel appears in AI Code Review CLI before a delayed fixture exits; see it fail with src/extension.ts:130 append removed, restore and pass. This red-first check cannot be executed on this host. Do not replace it with a mock asserting its own append call.

## Edge cases and test quality

- Pinned: clean/noisy result, stdin prompt delivery, invalid JSON, nonzero exit, bounded stderr tail, stdout before completion, cancellation PID death and no result file.
- Medium gaps (not written): 4 MB boundary −1/exact/+1; pre-aborted signal; double invocation; cancel before diff collection completes; timeout; UTF-8 split chunks; cancellation during result rename; Windows taskkill; OutputChannel reopen after failure.
- Medium surviving mutations: dropping done/failed/idle updates in extension.ts leaves manually driven tree tests green; cancel integration test checks no result but does not itself check PID death or cleared tree status.
- Low gaps (not written): spinner rendering, accessible label/focus and viewport layout.
- Auth/ownership, money, dates, pagination: n/a for this issue's trusted custom-command status UI; trust guard unchanged.

## Inline independent review and truth-check

Hypotheses checked against raw diff and complete source:
1. A registered custom command updates the tree and appends stdout before completion.
2. Failure preserves the last stderr text and failed-node click opens that text.
3. Cancel targets the spawned process group, creates no result, and returns status to idle.

Source supports these hypotheses at extension.ts:110–142, CLIReview.ts:20–75 and CodeReviewTreeProvider.ts:62–79. Real-process tests support streaming, bounded error messages and POSIX PID death. Shared status is a discriminated union; manifest handlers align. git blame attributes UI wiring to ebb94c3 atop issue 2's custom-command pipeline. No unrelated product changes or confirmed blocking application defect found.

All PR review threads and replies were read: 10 file summaries plus 1 inline author note; no human questions or reviewer findings. Existing notes remain intact. No prior reviewer report to recheck.
Truth confidence: process 90/100; end-to-end UI 45/100, below configured 70. Source wiring alone cannot prove rendered output, real status transitions, toasts or cancellation from the tree. No approval granted.

## To unblock

On a desktop host with an available display, run:

```sh
npm ci --silent && npm run check-types && npm run lint && npm run test:cli && npm run compile
CLI_REVIEW_TEST=1 CLI_TEST_VSCODE='/Applications/Visual Studio Code.app/Contents/MacOS/Code' node out/test/runTest.js
```

Complete the AC3 red-first integration check and verify all five ACs with fixture commands, including success, failure and slow cancellation. Capture all required screenshots, commit evidence, and return the card to QA. This block requires desktop access, not a merge approval; no approval-request token is created.

## Exact local test output

```text
v20.19.4
[watch] build started
[watch] build finished

> ai-code-review-assistant@0.9.0 check-types
> tsc --noEmit


> ai-code-review-assistant@0.9.0 lint
> eslint src --ext ts


/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ai/CLIReview.ts
  9:39  warning  'chunk' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ai/ExternalAIManager.ts
  3:27  warning  'PromptResult' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ai/PromptGenerator.ts
    5:13  warning  'os' is defined but never used       no-unused-vars
  243:75  warning  'request' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ai/providers/AmazonQProvider.ts
  91:43  warning  '_prompt' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ai/providers/BaseAIProvider.ts
   8:19  warning  'request' is defined but never used           no-unused-vars
  18:35  warning  'request' is defined but never used           no-unused-vars
  23:29  warning  'options' is assigned a value but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ai/providers/CopilotProvider.ts
  108:43  warning  '_prompt' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ai/providers/CursorAIProvider.ts
  91:44  warning  '_prompt' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/core/ChangeDetector.ts
  5:13  warning  'os' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/extension.ts
  12:10  warning  'CleanupManager' is defined but never used  no-unused-vars
  13:37  warning  'CodeIssue' is defined but never used       no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/test/suite/ChangeDetector.test.ts
  3:13  warning  'path' is defined but never used        no-unused-vars
  4:13  warning  'fs' is defined but never used          no-unused-vars
  5:31  warning  'after' is defined but never used       no-unused-vars
  7:22  warning  'ChangeInfo' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/test/suite/CleanupManager.test.ts
  7:9  warning  'workspaceFolder' is assigned a value but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/test/suite/ExternalAIManager.test.ts
  2:13  warning  'vscode' is defined but never used  no-unused-vars
  3:31  warning  'after' is defined but never used   no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/test/suite/Integration.test.ts
    6:10  warning  'CodeReviewPanel' is defined but never used  no-unused-vars
    7:37  warning  'CodeIssue' is defined but never used        no-unused-vars
    7:48  warning  'IssueSeverity' is defined but never used    no-unused-vars
    7:63  warning  'IssueCategory' is defined but never used    no-unused-vars
    8:13  warning  'path' is defined but never used             no-unused-vars
    9:13  warning  'fs' is defined but never used               no-unused-vars
  171:59  warning  'items' is defined but never used            no-unused-vars
  171:73  warning  'options' is defined but never used          no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/test/suite/TestExamples.test.ts
  8:22  warning  'ChangeInfo' is defined but never used     no-unused-vars
  8:47  warning  'ReviewRequest' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/test/suite/UIComponents.test.ts
  3:31  warning  'after' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/test/suite/extension.test.ts
  1:13  warning  'assert' is defined but never used  no-unused-vars
  2:13  warning  'vscode' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/types/index.ts
  70:5  warning  'LOW' is defined but never used              no-unused-vars
  71:5  warning  'MEDIUM' is defined but never used           no-unused-vars
  72:5  warning  'HIGH' is defined but never used             no-unused-vars
  73:5  warning  'CRITICAL' is defined but never used         no-unused-vars
  77:5  warning  'SECURITY' is defined but never used         no-unused-vars
  78:5  warning  'PERFORMANCE' is defined but never used      no-unused-vars
  79:5  warning  'CODE_QUALITY' is defined but never used     no-unused-vars
  80:5  warning  'BEST_PRACTICES' is defined but never used   no-unused-vars
  81:5  warning  'STYLE' is defined but never used            no-unused-vars
  82:5  warning  'MAINTAINABILITY' is defined but never used  no-unused-vars
  83:5  warning  'TESTING' is defined but never used          no-unused-vars
  84:5  warning  'DOCUMENTATION' is defined but never used    no-unused-vars
  85:5  warning  'OTHER' is defined but never used            no-unused-vars
  89:5  warning  'LOCAL' is defined but never used            no-unused-vars
  90:5  warning  'COMMIT' is defined but never used           no-unused-vars
  91:5  warning  'BRANCH' is defined but never used           no-unused-vars
  92:5  warning  'ALL_FILES' is defined but never used        no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ui/CodeLensProvider.ts
   48:61  warning  'token' is defined but never used  no-unused-vars
  109:56  warning  'token' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ui/CodeReviewPanel.ts
  198:32  warning  'webview' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ui/CodeReviewTreeProvider.ts
  158:25  warning  'command' is defined but never used  no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ui/IssuesPanelProvider.ts
  327:25  warning  'command' is defined but never used   no-unused-vars
  330:25  warning  'groupKey' is defined but never used  no-unused-vars
  333:25  warning  'issueId' is defined but never used   no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ui/ReviewHistoryProvider.ts
   16:34  warning  '_extensionUri' is defined but never used  no-unused-vars
   20:9   warning  'context' is defined but never used        no-unused-vars
   21:9   warning  '_token' is defined but never used         no-unused-vars
  122:32  warning  'webview' is defined but never used        no-unused-vars

/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/src/ui/WorkflowGuidePanel.ts
  39:53  warning  'extensionUri' is defined but never used  no-unused-vars
  51:13  warning  'e' is defined but never used             no-unused-vars
  94:32  warning  'webview' is defined but never used       no-unused-vars

✖ 64 problems (0 errors, 64 warnings)


> ai-code-review-assistant@0.9.0 test:cli
> tsc && node --test src/test/node/*.cjs

TAP version 13
# Subtest: stdout arrives before exit; cancel kills the fixture and writes no result
ok 1 - stdout arrives before exit; cancel kills the fixture and writes no result
  ---
  duration_ms: 126.776042
  ...
# Subtest: failure includes the bounded stderr tail
ok 2 - failure includes the bounded stderr tail
  ---
  duration_ms: 21.091333
  ...
# Subtest: real CLI receives stdin and handles clean output
ok 3 - real CLI receives stdin and handles clean output
  ---
  duration_ms: 27.338583
  ...
# Subtest: real CLI receives stdin and handles noisy output
ok 4 - real CLI receives stdin and handles noisy output
  ---
  duration_ms: 21.541375
  ...
# Subtest: real CLI receives stdin and handles fail output
ok 5 - real CLI receives stdin and handles fail output
  ---
  duration_ms: 19.712834
  ...
# Subtest: real CLI receives stdin and handles invalid output
ok 6 - real CLI receives stdin and handles invalid output
  ---
  duration_ms: 20.348083
  ...
# Subtest: resolves Code without changing the signed bundle
ok 7 - resolves Code without changing the signed bundle
  ---
  duration_ms: 2.004583
  ...
# Subtest: resolves Electron without changing the signed bundle
ok 8 - resolves Electron without changing the signed bundle
  ---
  duration_ms: 0.795167
  ...
# Subtest: preserves non-macOS executable paths
ok 9 - preserves non-macOS executable paths
  ---
  duration_ms: 0.046333
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 534.895459

> ai-code-review-assistant@0.9.0 compile
> npm run check-types && node esbuild.js


> ai-code-review-assistant@0.9.0 check-types
> tsc --noEmit

[watch] build started
[watch] build finished

```

## Installed VS Code launch

```text
hint: Using 'master' as the name for the initial branch. This default branch name
hint: is subject to change. To configure the initial branch name to use in all
hint: of your new repositories, which will suppress this warning, call:
hint:
hint: 	git config --global init.defaultBranch <name>
hint:
hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
hint: 'development'. The just-created branch can be renamed via this command:
hint:
hint: 	git branch -m <name>
Exit code:   SIGABRT
Failed to run tests TestRunFailedError: Test run terminated with signal SIGABRT
    at ChildProcess.onProcessClosed (/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/node_modules/@vscode/test-electron/out/runTest.js:110:24)
    at ChildProcess.emit (node:events:507:28)
    at ChildProcess._handle.onexit (node:internal/child_process:294:12) {
  code: undefined,
  signal: 'SIGABRT'
}

```

## Cached VS Code launch

```text
hint: Using 'master' as the name for the initial branch. This default branch name
hint: is subject to change. To configure the initial branch name to use in all
hint: of your new repositories, which will suppress this warning, call:
hint:
hint: 	git config --global init.defaultBranch <name>
hint:
hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
hint: 'development'. The just-created branch can be renamed via this command:
hint:
hint: 	git branch -m <name>
Closing VS Code gracefully. Press Ctrl+C to force close.
Exit code:   SIGINT
Failed to run tests TestRunFailedError: Test run terminated with signal SIGINT
    at ChildProcess.onProcessClosed (/Users/gauwan/Codespaces/prompt-ai-code-review/.claude/worktrees/issue-4-qa/node_modules/@vscode/test-electron/out/runTest.js:110:24)
    at ChildProcess.emit (node:events:507:28)
    at ChildProcess._handle.onexit (node:internal/child_process:294:12) {
  code: undefined,
  signal: 'SIGINT'
}

```
