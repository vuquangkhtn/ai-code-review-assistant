# Pre-flight — cli-review board (linted 2026-11-15)

Each `[ ]` is a halt gate for `super-board run` — the loop refuses to start until all items are `[✓]`.

## 🔑 Credentials

- [✓] None required by the loop — all ticket ACs run through fixture CLI scripts; workers never authenticate to real AI backends (the extension itself stays API-key-free).

## 🛠 Tools

- [✓] `gh` CLI authenticated (verified: account vuquangkhtn)
- [✓] Node 20.19.4 via Volta (verified; engines >= 18)
- [✓] Dependencies installed; `npm run check-types` + `npm run lint` pass (verified 2026-11-15, 0 errors)
- [✓] VS Code test binary cached at `.vscode-test/` (present; e2e launches a real VS Code — display available on this macOS host)

## 🌐 Environment

- [✓] Board: project #4, base branch `main`, humans merge everything (PROJECT.md)
- [✓] Parent spec #1 stays off the board; buildable cards are #2–#5, all `feature` + `ready-for-agent`, #2 unblocked

## 🧑‍💻 Human follow-ups (not gates — do not halt the loop)

- After #3 lands: run one real review each against locally installed `codex` / `claude` / `copilot` (all present on PATH; confirm each is logged in before smoking). Fixture ACs verify invocation templates; this verifies the real backends.
- Standing: `test-examples/` deletion leaves e2e workspace-dependent suites skipping (pre-existing, unrelated to this feature). Restore or re-point `runTest.ts` before relying on e2e coverage as a regression net.
- Uncommitted local doc fix: PROJECT.md staleness rows (this lint's approved edit) — ride it on the next PR or a quick docs commit.
