# QA report — issue #36 · v1

- PR: vuquangkhtn/ai-code-review-assistant#37 · branch `issue-36-align-docs-v0.10.0` · head `fdec90b`
- Worktree: `.claude/worktrees/issue-36-qa/` at the Builder's branch tip
- Scope: docs-only claim-verification gate (README.md, package.json) against shipped behavior in `src/` — no test suite required by the card; every check below is a command with its output
- Verdict: **PASS** — 4/4 ACs verified; AC3's post-merge half is deferred to the Reviewer (n/a: post-merge)
- Evidence files: `evidence-commands.log` (all greps/dumps below), `local-tests.log` (check-types + lint full output)

## Per-AC ledger

### AC1 — README describes the shipped v0.10.0 feature set, no stale claims, manual flow still documented → PASS

One observable check per README claim, each against shipped code (full output in `evidence-commands.log`):

| README claim | Shipped code proof |
|---|---|
| Two ways to run a review (manual copy-paste + CLI Review) | `aiCodeReview.copyPrompt` "Manual Review" and `aiCodeReview.runCLIReview` "CLI Review" in `package.json` contributes; registered `src/extension.ts:166`, `src/extension.ts:216-217` |
| Detected presets for Codex, Claude Code, Copilot CLI, zcode | `src/ai/CLIPresets.ts:10-15` (`cliPresets` registry: codex, claude, copilot, zcode) |
| Windows detection covers native executables + `.cmd`/`.bat` wrappers | `src/ai/CLIPresets.ts:24` (`win32 ? ['.exe', '.com', '.cmd', '.bat'] : ['']`) |
| One detected provider runs silently; pick once, persists across sessions | `src/ai/CLIPresets.ts:59` (`available.length === 1 ? available[0].id : choose(...)`), saved via `context.globalState.update('aiCodeReview.cli.defaultProvider', ...)` at `src/extension.ts:279` |
| `aiCodeReview.cli.defaultProvider` (`auto` keeps detect-once) | `package.json` configuration property, default `"auto"`; forced-provider errors at `src/ai/CLIPresets.ts:51-56` |
| `aiCodeReview.cli.customCommand` always overrides presets | `src/ai/CLIPresets.ts:46` (`if (options.customCommand.trim()) return ...`) |
| **Select CLI Provider** switcher | `aiCodeReview.selectCLIProvider` in contributes + `src/extension.ts:327-356` |
| Live per-file progress on the review tree row | `src/ai/CLIReview.ts:29-31` (`onProgress {reviewed, total}`) → `src/extension.ts:289` → `src/ui/CodeReviewTreeProvider.ts:12-15` (description `reviewed/total files`, icon `loading~spin`) |
| Clicking the running row (or **Cancel CLI Review**) asks "Stop the running review?" | `src/extension.ts:212` (`showWarningMessage('Stop the running review?', { modal: true }, 'Stop')`); row commandTitle at `src/ui/CodeReviewTreeProvider.ts:14` |
| Stall fail-fast instead of hanging | startup watchdog `src/ai/CLIReview.ts:82-90` ("CLI review stalled: no output within N ms"); setting `aiCodeReview.cli.stallTimeoutMs` (default 120000) in `package.json` |
| Failure names alternatives + **Switch CLI Provider** recovery | `src/ai/CLIPresets.ts:165-180` (`suggestFailureRecovery` message lists alternatives) + action button `src/extension.ts:308-313` |
| CLI Review in a trusted workspace | `src/extension.ts:227-230` (`if (!workspace || !vscode.workspace.isTrusted) throw new Error('CLI review requires a trusted workspace.')`) |
| Branch comparison works in CLI mode ("CLI receives the branch-diff prompt") | `src/extension.ts:151-161` (`collectCLIChanges` → `detectAndStoreBranchChanges(source, target)` when `defaultChangeType` is `branch`/`commit`) |
| Multiple review types: local changes, commits, branch comparisons | `ChangeType` enum `src/types/index.ts:92-97` (LOCAL/COMMIT/BRANCH); "Commit Review - Review specific commits" documented in FEATURES.md:31 |
| Issues panel severity indicators + navigation, confidence + evidence, policy `Blocking` (`aiCodeReview.policy.blockOn`) | `src/types/index.ts:9-10` (`confidence?`, `evidence?` on ReviewIssue); `aiCodeReview.policy.blockOn` in `package.json`; `⛔ Blocking ·` label at `src/ui/IssuesPanelProvider.ts:196-201` |
| **Paste to AI Chat…** on the completion alert | completion alert `src/ai/ExternalAIManager.ts:97-107` ("Prompt For … copied to clipboard!" with `Paste to AI Chat…` action → `aiCodeReview.pastePrompt`, instructions at `src/extension.ts:492-520`) |
| Smart prompt generation with code context | `PromptGenerator.generateFileReferencePrompt` used at `src/extension.ts:246,284` (`src/ai/PromptGenerator.ts`) |
| Cmd+K Cmd+G = Manual Review | keybinding `aiCodeReview.copyPrompt` ← `cmd+k cmd+g` in `package.json` keybindings |

### AC1b — stale-claim sweep → PASS

- `grep -n "All Files\|review entire codebase\|No API keys or additional setup" README.md` → no matches (old wording gone).
- `AI Code Review: All Files` absent from `package.json` contributes (palette entry removed; the runtime registration at `src/extension.ts:375` has no palette title, so it stays hidden — README does not claim otherwise).
- Old dangling post-footer "### CLI provider defaults" section removed from README (PR diff deletes it); its content now lives in the CLI-mode body section.
- Manual copy-paste flow still documented: README lines 32-35 ("Manual mode: 3-step process") and line 46 (`Cmd+K Cmd+G` Manual Review).

### AC2 — package.json description/keywords match the positioning; check-types + lint green → PASS

- `package.json` parses as valid JSON (`python3 -c "import json; json.load(open('package.json'))"` — no error).
- `description` = "AI code reviews in VS Code: copy-paste structured prompts with any AI, or run one-click CLI reviews through Codex, Claude Code, Copilot CLI, or zcode — no API keys." — matches the README's two-mode positioning exactly.
- `keywords` = code review, ai, cli, codex, claude, copilot, chatgpt, zcode, prompt, amazon-q, cursor-ai, typescript, javascript, html — covers the CLI-mode positioning.
- `npm run check-types` → exit 0 (`local-tests.log`).
- `npm run lint` → exit 0, 0 errors / 71 pre-existing warnings (`local-tests.log`; warnings predate this PR, none introduced by a docs change).

### AC3 — repo description proposed in the PR, applied post-merge → PASS (proposed) · unchecked (applied: n/a: post-merge)

- Proposed one-liner present in PR #37 body author notes: `repo-description: AI code reviews in VS Code: copy-paste structured prompts with any AI, or run one-click CLI reviews through Codex, Claude Code, Copilot CLI, or zcode — no API keys.`
- Length 164 chars (GitHub repo About limit 350) — verified with python.
- Identical to the new `package.json` description (python comparison → True).
- Post-merge application (`gh repo edit --description` + `gh repo view --json description`) cannot run on a branch — **n/a: post-merge**; the Reviewer applies and verifies it after merge. AC left unchecked in the PR `ac` block with this reason.

### AC4 — privacy claim consistent between README and FEATURES.md → PASS

- README.md:73 — "Manual copy-paste mode makes no outbound AI calls. CLI mode sends code through the CLI's own backend only when you explicitly run **CLI Review**"
- FEATURES.md:24 — "Manual mode makes no outbound AI calls; explicitly triggered CLI reviews send code through the CLI's own backend"
- Same scoping on both sides: manual = no outbound calls; CLI = CLI's own backend, explicit trigger only. FEATURES.md:340 ("Providers use their own authentication and backend") agrees with README's "CLI mode uses the CLI's own login".
- Code-level confirmation: `grep` for `fetch(`/`axios`/`https.request`/`http.request`/`XMLHttpRequest` across `src/` (tests excluded) → 0 matches; the extension never makes an outbound AI call itself.

## Test-gap check (docs card)

- Every README claim maps to shipped code verified above; the underlying CLI behavior is already covered by existing suites (`src/test/suite/cliReview.test.ts`, `cliStatus.test.ts`).
- No High gaps — nothing in a docs PR needs app-code change. Medium/Low gaps: none material (the only runtime-only surface left untestable on a branch is the AC3 post-merge `gh repo edit`, which is the Reviewer's step by design).

## Incidents

- One false halt during reads: a required read used `--kind object` against a list endpoint (`pulls/37/comments` → `[]`), which retried 3x and tripped the shared halt file. Recovered via the helper's `--resume` with a replacement `object` read on PR #37 (service confirmed, halt cleared, record archived as `github-halt-1795271745442661000.json` + copy at `/tmp/sb-halt-issue36-qa-v1-backup.json`). No mutation was involved and no state was lost. Subsequent reads used `--kind array` correctly.

## Local tests

```
Local tests: npm run check-types && npm run lint
```

(check-types exit 0; lint exit 0 — 0 errors, 71 pre-existing warnings)
