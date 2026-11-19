# QA v1 — issue 3

Head reviewed: af2a92afb16297ef902b8d2bcd0d971414a6026f. Outcome: fail, return to Builder.

## Acceptance ledger

| AC | Unit/process | Component | Extension host |
|---|---|---|---|
| One CLI silently completes | cliPresets.cjs:35, passes on POSIX; Windows shim witness fails | none | preset test exists; run produced no results |
| Multiple providers ask once and persist | cliPresets.cjs:47, disk round-trip passes | none | picker/session proof missing |
| Custom overrides preset | cliPresets.cjs:68, passes | none | custom-command tests exist; run produced no results |
| Safe invocation templates | cliPresets.cjs:35, all three exact argv fixtures pass | n/a | no live backend invoked |
| Privacy copy | README/FEATURES diff inspected; both scope outbound CLI traffic to explicit trigger | n/a | n/a: documentation |

## Failing witness

Run `npm run test:cli && node docs/super-board/runs/issue-3-qa-v1/windows-shim.cjs`.
The first command passes 13/13; the second fails with "No supported CLI found on PATH".
The witness uses a real temporary PATH directory containing only claude.cmd and evaluates the compiled selector with platform=win32. It tests detection, not Windows process creation.
Expected: detect the installed shim silently, then invoke safely with literal prompt data.
Actual: src/ai/CLIPresets.ts:23 appends only .exe, so Windows shell shims are never candidates.
Fix: support the standard Windows CLI launchers with safe argument handling and Windows fixtures. Do not weaken shell-injection protections. The README workaround does not meet the issue's zero-configuration requirement.

## Checks and limitations

`npm ci --silent && npm run check-types && npm run lint && npm run test:cli` passed (lint: 0 errors, 65 warnings).
`CLI_REVIEW_TEST=1 CLI_TEST_VSCODE=<cached Code binary> npm test` reached the test runner but produced no test results; stopped after waiting. See extension-host.log. No GUI, viewport screenshots, console/network artifacts or session-persistence evidence captured. No live provider or credentials used.
Independent review: custom precedence, saved-provider removal, picker cancellation, non-executable/directory candidates, shell-free argv, and explicit privacy copy inspected. Existing fixtures cover those POSIX branches. Windows .cmd witness is a High gap requiring application changes. Test-gap truth score: 60/100; desktop/session and Windows invocation proof remain absent. No prior QA/reviewer findings existed in the fetched threads.

## Test gaps (not written)

Medium: storage update rejection; prompt/save races on double invocation; native Windows execution and quoted paths. High extension-host picker/persistence proof still needs a functioning VS Code session; do not mark those ACs verified from the disk-state helper fixture alone.
