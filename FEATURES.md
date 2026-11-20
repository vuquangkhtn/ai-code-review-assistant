# 🚀 AI Code Review Assistant - Features & Usage Guide

*Complete guide to all features and how to use them effectively*

## 📋 Table of Contents

- [Core Features Overview](#-core-features-overview)
- [Command Reference](#-command-reference)
- [UI Components](#-ui-components)
- [Configuration Settings](#-configuration-settings)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Workflow Examples](#-workflow-examples)
- [Advanced Usage](#-advanced-usage)

## ✨ Core Features Overview

### 🎯 Smart Prompt Generation
**What it does:** Creates structured, detailed prompts for AI code reviews that work with any AI provider.

**Key Benefits:**
- No API keys required - works with any AI service
- Comprehensive code context included
- Structured format for consistent results
- Manual mode makes no outbound AI calls; explicitly triggered CLI reviews send code through the CLI’s own backend

### 🔄 Multiple Review Types
**Available Review Modes:**
1. **Local Changes** - Review uncommitted changes (git diff)
2. **All Files** - Comprehensive codebase review
3. **Branch Comparison** - Compare changes between branches
4. **Commit Review** - Review specific commits

### 📊 Structured Results Display
**Features:**
- Organized issues panel with severity indicators
- Optional `confidence` (`high`, `medium`, `low`) and supporting `evidence` in review JSON
- Confidence labels in the issues tree and review panel; older results need no migration
- Inline annotations in code
- CodeLens integration for quick actions
- Filterable and sortable issue lists

### 🎨 Clean Interface
**UI Components:**
- Dedicated sidebar panel
- Issues tree view with context actions
- Workflow guide panel
- Settings integration

## 🎮 Command Reference

### Primary Commands

#### `AI Code Review: Manual Review`
**Command ID:** `aiCodeReview.copyPrompt`  
**Shortcut:** `Cmd+K Cmd+G` (Mac) / `Ctrl+K Ctrl+G` (Windows/Linux)  
**Usage:** Main command to generate and copy AI review prompts

**How to use:**
1. Open Command Palette (`Cmd+Shift+P`)
2. Type "Manual Review" or use the keyboard shortcut
3. Select review type when prompted
4. Prompt is automatically copied to clipboard
5. Choose **Paste to AI Chat…** on the completion alert for the existing manual-paste instructions, or **Open Changes** to inspect the changes file. Both local and branch-comparison prompts offer these actions.
6. Paste into your preferred AI tool

#### `AI Code Review: Local Changes`
**Command ID:** `aiCodeReview.copyPromptLocalChanges`  
**Usage:** Review only uncommitted changes using git diff

**Best for:**
- Quick reviews before committing
- Checking work-in-progress code
- Validating recent changes

**How to use:**
1. Make some changes to your code (don't commit yet)
2. Run this command
3. Extension analyzes git diff and creates focused prompt
4. Copy prompt to AI for targeted feedback

#### `AI Code Review: All Files`
**Command ID:** `aiCodeReview.copyPromptAllFiles`  
**Usage:** Comprehensive review of entire codebase

**Best for:**
- New project audits
- Comprehensive code quality checks
- Architecture reviews
- Onboarding new team members

**How to use:**
1. Run command from any file in your project
2. Extension scans all supported files
3. Generates comprehensive prompt with full context
4. Use with AI for complete codebase analysis

#### `AI Code Review: Compare Branches`
**Command ID:** `aiCodeReview.copyPromptCompareBranches`  
**Usage:** Compare changes between two git branches

**Best for:**
- Pull request reviews
- Feature branch analysis
- Release preparation
- Merge conflict resolution

**How to use:**
1. Ensure you have multiple branches in your repo
2. Run the command
3. Select source and target branches when prompted
4. Extension generates diff-based prompt
5. Get AI feedback on branch differences

### Result Processing Commands

#### `AI Code Review: Check Code Review Result`
**Command ID:** `aiCodeReview.checkReviewResult`  
**Usage:** Process AI response and display structured results

**How to use:**
1. After getting AI response, copy it
2. Run this command
3. Paste the AI response when prompted
4. Extension parses and displays results in UI panels
5. View issues in sidebar with severity indicators
6. Use CodeLens "Resolve" buttons or context menu to mark issues

#### `AI Code Review: Mark Issue as Resolved`
**Command ID:** `aiCodeReview.markIssueResolved`  
**Usage:** Mark a specific issue as resolved

**How to use:**
- Right-click on an issue in the Issues panel
- Select "Mark as Resolved" from context menu
- Issue will be visually marked as resolved with strikethrough

#### `AI Code Review: Mark Issue as Unresolved`
**Command ID:** `aiCodeReview.markIssueUnresolved`  
**Usage:** Mark a previously resolved issue as unresolved

**How to use:**
- Right-click on a resolved issue in the Issues panel
- Select "Mark as Unresolved" from context menu
- Issue will return to normal visual state

### File Management Commands

#### `AI Code Review: Open Prompt File`
**Command ID:** `aiCodeReview.openPromptFile`  
**Usage:** Open the last generated prompt file for review or editing

#### `AI Code Review: Open Change File`
**Command ID:** `aiCodeReview.openChangeFile`  
**Usage:** Open the file containing detected changes

### Utility Commands

#### `AI Code Review: Open Settings`
**Command ID:** `aiCodeReview.openSettings`  
**Usage:** Quick access to extension configuration

#### `AI Code Review: Paste Prompt to AI Chat`
**Command ID:** `aiCodeReview.pastePrompt`  
**Usage:** Shows instructions for using the generated prompt

## 🖥️ UI Components

### Sidebar Panel
**Location:** Activity Bar → AI Code Review icon

**Features:**
- **Code Review Panel:** Main controls and quick actions
- **Issues Panel:** Displays parsed AI feedback with filtering

### Code Review Panel
**Functions:**
- Generate prompts for different review types
- Access workflow guide
- Quick settings access
- View recent prompt and change files

**Usage:**
1. Click AI Code Review icon in Activity Bar
2. Choose review type from available options
3. Follow workflow guide for best results

### Issues Panel
**Features:**
- **Severity Indicators:** Visual severity levels (Critical, High, Medium, Low)
- **File Navigation:** Click to jump to specific issues
- **Context Actions:** Mark issues as resolved/unresolved
- **Filtering:** Filter by severity, file, or resolution status

**Usage:**
1. After processing AI results, issues appear here
2. Click any issue to navigate to the code location
3. Use context menu to mark issues as resolved
4. Filter issues using the gear icon

**Mark as Resolved/Unresolved:**
- **Right-click context menu:** Select "Mark as Resolved" or "Mark as Unresolved"
- **CodeLens integration:** Use inline "Resolve" buttons in the editor
- **Visual indicators:** Resolved issues show with strikethrough text
- **Filtering:** Use filter options to show/hide resolved issues
- **Persistence:** Resolution status is saved and persists across sessions

### CodeLens Integration
**Features:**
- Inline "Resolve" actions above problematic code lines
- Quick issue resolution without leaving the editor
- Automatic updates when issues are resolved

**How to use CodeLens:**
1. After processing AI review results, CodeLens appears above lines with issues
2. Click "Resolve" to mark an issue as resolved
3. Click "Mark Unresolved" to revert resolution status
4. CodeLens automatically updates when issue status changes
5. Resolved issues are visually distinguished in the Issues panel

**Supported Languages:**
- JavaScript, TypeScript, HTML, CSS, JSON, JSX, TSX
- Configurable in settings

**CodeLens Configuration:**
- Enable/disable via `aiCodeReview.codeLens.enabled` setting
- Customize supported file types via `aiCodeReview.codeLens.selector`

### Workflow Guide Panel
**Access:** Command Palette → "Open Workflow Guide"

**Contains:**
- Step-by-step usage instructions
- Best practices for AI prompts
- Troubleshooting tips
- Integration examples

## ⚙️ Configuration Settings

### `aiCodeReview.defaultChangeType`
**Type:** String (enum)  
**Options:** `local`, `commit`, `branch`, `all-files`  
**Default:** `local`  
**Description:** Sets the default review type when using the main command

### `aiCodeReview.autoCache`
**Type:** Boolean  
**Default:** `true`  
**Description:** Automatically cache review results and user preferences

### `aiCodeReview.severityThreshold`
**Type:** String (enum)  
**Options:** `low`, `medium`, `high`, `critical`  
**Default:** `low`  
**Description:** Minimum severity level to display in issues panel

### `aiCodeReview.supportedLanguages`
**Type:** Array of strings  
**Default:** `["javascript", "typescript", "html"]`  
**Description:** Programming languages to include in code reviews

### `aiCodeReview.excludeFileExtensions`
**Type:** Array of strings  
**Default:** `[".min.js", ".min.css", ".map", ".lock", ".log"]`  
**Description:** File extensions to exclude from reviews

### `aiCodeReview.codeLens.enabled`
**Type:** Boolean  
**Default:** `true`  
**Description:** Enable/disable CodeLens integration

### `aiCodeReview.codeLens.selector`
**Type:** Array of strings  
**Default:** `["javascript", "typescript", "html", "css", "json", "jsx", "tsx"]`  
**Description:** File types where CodeLens should appear

## ⌨️ Keyboard Shortcuts

### Primary Shortcut
**`Cmd+K Cmd+G`** (Mac) / **`Ctrl+K Ctrl+G`** (Windows/Linux)
- Triggers the main "Manual Review" command
- Most frequently used shortcut
- Works from any file in the workspace

### Custom Shortcuts
You can add custom keybindings in VS Code settings:

```json
{
  "key": "cmd+shift+r",
  "command": "aiCodeReview.copyPromptLocalChanges"
},
{
  "key": "cmd+shift+a",
  "command": "aiCodeReview.copyPromptAllFiles"
}
```
## 🚀 Advanced Usage

### Custom AI Prompts
**Tip:** You can modify generated prompts before sending to AI:
1. Generate prompt using extension
2. Open the prompt file using "Open Prompt File"
3. Edit prompt to add specific requirements
4. Copy modified prompt to AI

### Team Integration
**Best Practices:**
- Standardize severity thresholds across team
- Share configuration settings via workspace settings
- Use branch comparison for consistent PR reviews
- Document team-specific prompt modifications
---

*Built with ❤️ for developers who want AI-powered code reviews without the complexity*

**Need Help?** 
- Check the [Workflow Guide Panel](command:aiCodeReview.openWorkflowGuide)
- Visit our [GitHub Repository](https://github.com/vuquangkhtn/ai-code-review-assistant)
- Open [Extension Settings](command:aiCodeReview.openSettings)
### CLI Review

Optionally set `aiCodeReview.cli.customCommand` to a shell command, then run **AI Code Review: CLI Review** in a trusted workspace. With Local Changes selected, the command receives the local-changes prompt on stdin. With Compare Branches selected, it asks for source and target branches using the manual-review picker, checks out the target, and receives the branch-comparison prompt on stdin. Dismissing either branch picker leaves the working tree unchanged and returns to idle. The command runs in the workspace folder, and must print a JSON object containing an `issues` array. The configured CLI may send code to its provider.

The extension extracts JSON from stdout, including banner-wrapped output, and writes it to `.ai-code-review/results/` for the existing watcher. The clipboard is unchanged. Nonzero exit or invalid JSON creates no result. Output is limited to 4 MiB and execution to five minutes. Manual copy-paste prompts retain their existing instructions.

A startup watchdog catches stuck CLIs: if the provider CLI produces no output within `aiCodeReview.cli.stallTimeoutMs` (default 120000 ms, `0` disables), the run fails fast with a stall error instead of waiting the full five-minute timeout — the first output on stdout or stderr proves the CLI is alive and disarms the watchdog, so long-but-alive reviews keep the full timeout. Failure messages classify the cause: stall, timeout, non-zero exit (with the stderr tail), or failed to start on spawn errors. When a run fails, the message offers recovery: with another detected provider it names the alternatives and shows a **Switch CLI Provider** action that opens **AI Code Review: Select CLI Provider** to change the active provider; with no alternative it points to the CLI output channel for diagnosis and the `aiCodeReview.cli` settings.

Run fixture integration tests with `npm run test:cli`. On a host that can launch VS Code, run `npm run compile && npx tsc && CLI_REVIEW_TEST=1 npm test` for the palette-command and watcher tests.

Without a custom command, PATH detection selects Codex (`--ask-for-approval never exec --sandbox read-only -`),
Claude Code (`-p --output-format text`), Copilot (`--silent --allow-tool=read -p`), or zcode (`-p`).
One installed provider is used silently; several show a picker once and persist
the choice across sessions. Cancelling starts no review. If the saved provider
is removed, detection runs again. A custom command overrides all presets.
Codex and Claude receive the prompt on stdin; Copilot and zcode receive it as a
literal prompt argument (`zcode -p <prompt>` — the documented headless mode of
zcode 0.17.3; zcode is not verified end to end on hosts where it is not
installed, and `aiCodeReview.cli.customCommand` remains the fallback for any
provider whose flags cannot be verified).
On Windows, `.exe`, `.com`, `.cmd` and `.bat` providers are detected. Providers use their own authentication and backend;
no code is sent until you explicitly trigger the CLI review command.

Set `aiCodeReview.cli.defaultProvider` to pick the provider up front: `auto` (default)
keeps the detect-once-and-persist behavior above; a concrete provider (`codex`,
`claude`, `copilot`, `zcode`) is used whenever it is on PATH and takes precedence
over the persisted pick — if it is not installed, CLI Review fails with instructions
to install it or set the setting back to `auto`. The preset registry is data-driven:
a new provider is one entry in `src/ai/CLIPresets.ts` plus its enum value in the
setting; selection, persistence and comparison reuse it unchanged.

Run **AI Code Review: Select CLI Provider** to switch providers from the Command
Palette. It lists every detected preset plus the configured custom command, marks
the current one (`auto` mode: the persisted pick; a concrete setting: that provider,
shown as `not found on PATH (current)` when it is not installed), and switching
persists the choice for the next CLI review without re-prompting. When the setting
is a concrete provider, switching rewrites the setting so the switch is not
silently superseded; the custom command always overrides presets until
`aiCodeReview.cli.customCommand` is cleared.
Use **CLI Review** in the review tree to start the same custom command. The single row reflects
the run: a spinner with reviewed/total progress in its description while running, a check when
done, and the failure message on failure. Clicking the row while it runs — or **Cancel CLI
Review** in the Command Palette — asks "Stop the running review?" and aborts only on consent;
extension shutdown still aborts without asking. There is no separate status row. Stdout streams
into **AI Code Review CLI** in the Output panel; failed runs show the last 4096 stderr characters
in the error toast, row description, and output channel. **Open Workflow Guide** and **Paste
Prompt to AI Chat** are Command Palette commands, not tree rows.

### Severity policy

Set `aiCodeReview.policy.blockOn` to `critical` to flag critical findings, or `high`
to flag both high and critical findings. The findings tree and review panel show
`Blocking` beside matching findings and a summary of the policy count. Lower
severities keep their existing display. The default, `off`, preserves the existing
appearance. Changes apply immediately to loaded findings, including resolved ones;
the summary counts all loaded findings, regardless of the current display filter.
This is a visual flag only: it does not stop a review, change saved results, or block a merge.

### Compare two CLI providers

Configure `aiCodeReview.cli.comparisonCommands` with at least two names and shell commands, for example:

```json
"aiCodeReview.cli.comparisonCommands": {
  "Codex": "codex exec --sandbox read-only -",
  "Claude": "claude -p --output-format text"
}
```

Run **AI Code Review: Compare Two CLI Providers** and select exactly two entries. Both receive the same local-changes prompt, run sequentially under the CLI review lock, and save separate JSON files. Cancel Review stops the comparison. Commands run only in a trusted workspace and may send code to both providers.

When `aiCodeReview.cli.comparisonCommands` has no named commands, the comparison falls back to the same preset auto-detection as CLI Review (Codex, Claude Code, Copilot CLI on PATH): with exactly two detected both run directly; with more than two a picker selects the two to compare; with fewer than two the error names the setting and shows a two-entry example. Named entries remain the explicit override and keep their labels in the output headers.

The **Provider Comparison** sidebar groups findings by file and line. Matching titles (ignoring case and surrounding whitespace) at the same location are marked **Shared**; others are **Unique**. Provider rows retain severity and optional confidence, with descriptions, suggestions and evidence in the tooltip. Shared means matching reports, not independent proof that a finding is correct.
