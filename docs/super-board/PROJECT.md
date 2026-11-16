# PROJECT — ai-code-review-assistant

## What this is

VS Code extension (TypeScript, esbuild-bundled) that generates structured prompts for AI code reviews. Works with any AI provider via copy-paste — no API keys, no network calls to AI services. Users copy a generated prompt, paste it into ChatGPT/Claude/Copilot/etc., then load the JSON response back into VS Code for structured issue display.

## Repo map

| Path | What lives there |
|---|---|
| `src/extension.ts` | Extension entry point (commands, activation) |
| `src/core/` | Review logic (e.g. `ChangeDetector.ts` — git diff / commit / branch analysis) |
| `src/ai/` | `PromptGenerator.ts`, `ResponseParser.ts`, `ExternalAIManager.ts` + `providers/` (dead code — nothing imports it; shipped flow is the other three) |
| `src/ui/` | Panels and webviews (`CodeReviewPanel`, `IssuesPanelProvider`, `CodeLensProvider`, `ReviewHistoryProvider`, ...) |
| `src/types/`, `src/utils/` | Shared types, helpers |
| `src/test/suite/` | Mocha tests, run via `@vscode/test-electron` |
| `docs/` | Landing-page site (deployed to GitHub Pages) |
| `scripts/` | `generate-changelog.js` |
| `esbuild.js`, `tsconfig.json` | Bundler and TS config |
| `dist/`, `out/` | Build artifacts — never edit, never commit changes to them |

## Commands

| Task | Command |
|---|---|
| Type-check | `npm run check-types` (tsc --noEmit) |
| Compile (dev bundle) | `npm run compile` (check-types + esbuild) |
| Production bundle | `npm run package` |
| Lint | `npm run lint` (eslint, `src/` only) |
| E2e tests | `npm test` — runs `pretest` first (compile + lint), then launches VS Code via `@vscode/test-electron` |
| VSIX package | `npm run package:vsix` |
| Release | `npm run release` (semantic-release) |
| Clean artifacts | `npm run clean` (removes `dist/`, `out/`, `*.vsix`) |

## Conventions

- **Commits:** Conventional Commits, enforced by husky + commitlint (`config-conventional`). Use `npm run commit` (git-cz) if unsure of the format.
- **Versioning:** semantic-release owns version, CHANGELOG.md, and publish. Never bump `package.json` version or edit CHANGELOG.md by hand — release commits do it.

## CI / Deployment

- `.github/workflows/complete-pipeline.yml` — on push to `main`/`master`: type-check, lint, build, package VSIX, then release. Note: the test step is commented out in this workflow.
- `.github/workflows/deploy-pages.yml` — deploys the `docs/` landing page to GitHub Pages on push to `main`/`master`.
- All other workflows (`ci.yml`, `publish-*.yml`, `version-bump.yml`, `lerna-release.yml`) are `.disabled`.

## Board

- GitHub project "Ai-code-review-assistant board" (vuquangkhtn #4).
- Base branch: `main`. Humans merge everything — open a PR, never push to `main` directly.

## Gotchas

- `dist/` (esbuild output, extension entry `dist/extension.js`) and `out/` (tsc test output) are build artifacts; regenerate instead of editing.
- `npm test` needs a display environment — it downloads and launches real VS Code via `@vscode/test-electron`. On headless CI/Linux use Xvfb or skip; CI currently does not run tests.
- `test-examples/` was deleted (4192e62): `npm run test:examples` fails outright, and e2e still opens the missing folder as workspace, so workspace-dependent suites skip. Restore or re-point before trusting e2e coverage.
- Runtime deps are minimal on purpose (`simple-git`, `uuid`); the extension must stay API-key-free and offline relative to AI providers.
- Node pinned via Volta to 20.19.4; engines require >= 18.
- When touching `package.json` `contributes` (commands, views, config), remember `activationEvents` and `main` must stay consistent with `src/extension.ts`.
