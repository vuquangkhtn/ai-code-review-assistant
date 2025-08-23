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
- Privacy-focused - code stays local

### 🔄 Multiple Review Types
**Available Review Modes:**
1. **Local Changes** - Review uncommitted changes (git diff)
2. **All Files** - Comprehensive codebase review
3. **Branch Comparison** - Compare changes between branches
4. **Commit Review** - Review specific commits

### 📊 Structured Results Display
**Features:**
- Organized issues panel with severity indicators
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

#### `AI Code Review: Copy AI Prompt`
**Command ID:** `aiCodeReview.copyPrompt`  
**Shortcut:** `Cmd+K Cmd+G` (Mac) / `Ctrl+K Ctrl+G` (Windows/Linux)  
**Usage:** Main command to generate and copy AI review prompts

**How to use:**
1. Open Command Palette (`Cmd+Shift+P`)
2. Type "Copy AI Prompt" or use the keyboard shortcut
3. Select review type when prompted
4. Prompt is automatically copied to clipboard
5. Paste into your preferred AI tool

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
- Triggers main "Copy AI Prompt" command
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