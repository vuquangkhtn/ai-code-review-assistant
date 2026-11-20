# QA report — issue #22 · provider switcher command + defaultProvider setting

- PR: #34 · branch `issue-22-provider-switcher` · head reviewed `bed330e`
- Date: 2026-11-21 · lane: qa · v1 · environment: no GUI/display (data/commands layer only)
- Verdict: **PASS** — 6/6 ACs verified at the data/commands layer; 69 node tests green.

## Local verification

| Command | Result | Evidence |
|---|---|---|
| `npm run check-types` | exit 0, clean | check-types.log |
| `npm run lint` | exit 0 (0 errors; 71 pre-existing warnings) | lint.log |
| `npm run test:cli` | exit 0 — 69 tests: 68 pass, 0 fail, 1 skip | test-cli-node.log |

The single skip is the pre-existing Windows-only "Windows cmd shims run with literal
arguments from a PATH containing spaces" (`skip: process.platform === 'win32'`) —
correctly skipped on darwin, unrelated to this change.

## AC ledger (one observable test per AC)

| AC | Asserting test (file:line) | Layer | Result |
|---|---|---|---|
| AC1 palette command switches; next review uses the new choice without re-prompting | `src/test/node/cliPresets.cjs:126` "switcher persists the picked provider and the next run uses it silently" — `save` called with the pick; follow-up `selectCLICommand(savedProvider=persisted, defaultProvider='auto')` returns claude with `choose` wired to `assert.fail` | unit/commands | pass |
| AC2 `aiCodeReview.cli.defaultProvider` selects when set; `auto` preserves detect/persist; switcher reflects the setting | `src/test/node/cliPresets.cjs:141` "defaultProvider setting overrides a stale persisted pick; auto keeps it" (forced claude beats persisted codex; missing forced zcode rejects with actionable message; `auto` and blank keep persisted) + `:165` "switcher reflects a concrete setting, rewrites it on switch…" | unit/commands | pass |
| AC3 switcher lists every detected preset + custom command when configured | `src/test/node/cliPresets.cjs:141` asserts ids equal the full detected set `['codex','claude','copilot']` + `:189` "switcher lists the configured custom command and marks it current" (`my-tool --review (current)`) | unit/commands | pass |
| AC4 registry data-driven; fixture-preset test | `src/test/node/cliPresets.cjs:30` "preset registry is data-driven and pins every documented invocation" (ids/args/promptArgument pinned; setting enum == `['auto', …preset ids]`; palette declaration pinned) + `:46` loop's zcode PATH-fixture run | unit | pass |
| AC5 zcode registry entry with verified flags + PATH note | registry entry `{id:'zcode', args:['-p'], promptArgument:true}` pinned by the registry test; FEATURES.md documents `-p <prompt>` (zcode 0.17.3 documented headless mode), the not-on-PATH detection limit, and `customCommand` fallback | unit + docs | pass |
| AC6 tests: switch persists; setting override wins; fixture preset flows through selection | AC1 test, AC2 override test, and the zcode fixture test (AC4) | unit/commands | pass |

Extension-host wiring (`src/extension.ts:295` registers `aiCodeReview.selectCLIProvider`,
messages on switch) is `n/a: no GUI/display in this environment` — the palette
declaration itself is pinned by the registry test (AC4). The lane ran the
commands/data layer per the card's environment note; no screenshots (non-visual
change, no display — omission is intentional per the evidence rules).

## Test-gap check (over the diff)

All six ACs have asserting tests; the two highest-risk logic paths (setting
precedence in `selectCLICommand`, persistence/setting-rewrite in
`switchCLIProvider`) were mutation-checked and both mutants were killed —
see mutation-check.log. Edge cases pinned: forced-but-not-installed reject
(`assert.rejects`, actionable `'auto'` instruction), blank/whitespace setting
treated as `auto`, cancel writes nothing, empty PATH actionable error,
custom command listed and marked current, prompt-argument vs stdin split for
all four presets.

### High gaps

None. No new tests required.

### Test gaps (not written) — do not block

- Low: no test detects all four registry presets simultaneously in one switcher
  listing (fixture tests cover them individually; same `detected.map` path).
- Low: no test for pick === forced setting (guard `settingForced !== picked` at
  `src/ai/CLIPresets.ts:159`) — switching to the already-forced provider persists
  but skips the setting rewrite; no observable behavior difference.
- Low: switching to a preset while `aiCodeReview.cli.customCommand` is set shows
  "CLI provider set to X" although the next run still uses the custom command —
  pre-existing documented precedence ("A custom command overrides all presets");
  the switcher does mark custom as `(current)`.
- n/a: quick-pick UI states and success/error messages (extension host; no display).
