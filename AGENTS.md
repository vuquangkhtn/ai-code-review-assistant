# AGENTS.md

VS Code extension ("AI Prompt Code Review", `ai-code-review-assistant`) that generates structured code-review prompts for copy-paste into any external AI provider (ChatGPT, Claude, Copilot, etc.) — no API keys, no outbound AI calls. Git diffs are collected via `simple-git`, results are parsed from user-saved JSON and rendered in tree/panel views.

## Commands

- `npm run compile` — typecheck (`tsc --noEmit`) + esbuild dev bundle → `dist/`
- `npm run check-types` — typecheck only
- `npm run lint` — ESLint over `src` (ts files only)
- `npm test` — integration tests via `@vscode/test-electron` (`pretest` runs compile + lint first); downloads VS Code, needs a display
- `npm run watch` — parallel esbuild + tsc watch
- `npm run package` — production bundle; `npm run package:vsix` — build `.vsix`
- `npm run release:dry-run` — preview semantic-release

## Layout

- `src/extension.ts` — entry point; command/tree/CodeLens registration
- `src/ai/` — `PromptGenerator`, `ResponseParser`, `ExternalAIManager`; `src/ai/providers/` — provider classes extending `BaseAIProvider`
- `src/core/ChangeDetector.ts` — git diff/change detection (local, commit, branch-compare)
- `src/ui/` — tree providers (`CodeReviewTreeProvider`, `IssuesPanelProvider`, `ReviewHistoryProvider`), `CodeLensProvider`, `InlineAnnotationsProvider`, webview panels
- `src/types/index.ts` — shared interfaces/enums; update here first when adding features
- `src/test/suite/` — mocha suites
- `docs/` — GitHub Pages site (has its own `.eslintrc.js`); `resources/` — extension icons
- Note: the "Project Structure" section in CONTRIBUTING.md is outdated (mentions `CodeReviewManager.ts`, `StorageManager.ts`, `AIProviderManager.ts` which no longer exist — the manager is `ExternalAIManager.ts`)

## Rules & conventions

- TypeScript `strict`, CommonJS, target ES2020. esbuild bundles `src/extension.ts` → `dist/extension.js` with `vscode` marked external; do not import `vscode` outside extension host code paths.
- VS Code engine floor is `^1.96.0` (`engines.vscode` and `@types/vscode` must move together). Commands, config, menus, and keybindings are all declared in `package.json` `contributes` — keep declarations in sync with handlers in `extension.ts`.
- **Conventional Commits are mandatory** (husky `commit-msg` hook runs commitlint; `pre-commit` runs lint + compile). semantic-release derives versions/changelog from commit messages on `main` (and `beta` prerelease) — never bump the version or edit CHANGELOG.md manually.
- Adding an AI provider: new class in `src/ai/providers/` extending the base, register it in `ExternalAIManager`, add the type to the enums in `src/types/index.ts`, and cover it in `src/test/suite/`.
- All user-facing strings/settings go through `aiCodeReview.*` configuration keys in `package.json`.

## Docs to read before sensitive changes

- `FEATURES.md` — full feature/behavior reference (README defers to it)
- `CONTRIBUTING.md` — workflow and provider guide (structure section stale, see above)
- `.releaserc.json` — release pipeline (commit-analyzer + changelog + git assets)
