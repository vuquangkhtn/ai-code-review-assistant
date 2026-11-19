# Issue 11 QA v2

Reviewed PR #14 head a13c88fbf6cf8b06ed616f6fa4a54694e16a6b30 against origin/main.
Decision: pass to Review. No merge attempted; Reviewer alone runs merge policy.

## Acceptance and test-gap ledger

| AC | Observable proof | Result |
|---|---|---|
| Optional types and both prompt contracts | check-types; reviewContract.cjs manual/CLI prompt test | Pass |
| Preserve metadata and accept legacy JSON | Three confidence levels, saved JSON, absent properties, malformed optional input | Pass |
| Tree/panel confidence and legacy tolerance | Actual IssuesPanelProvider plus production panel script executed in VM; optional label and legacy assertions | Pass under owner screenshot ruling |
| Node parse/render fixtures | npm run test:cli: 27 tests, 26 pass, one Windows-only skip | Pass |

Fresh command: `npm ci --silent && npm run check-types && npm run lint && npm run test:cli && npm run compile`.
Exit 0. Lint: 0 errors, 66 existing warnings. Typecheck and compile pass.
Owner host evidence: `../issue-11-owner-gui/host-run.log` ends with 9 passing, Exit code 0; OUTPUT.md describes installed real VS Code and baseline correction. Host suite exercises CLI regression behavior, not confidence layout. No fresh lane GUI success claimed.
The only source change since v1 is the intentional manual prompt baseline pin in cliReview.test.ts; inspected against the prompt delta and owner host log. Fresh contracts still pass.

## Independent inline review and truth check

Standards and spec reviewed separately inline, per Codex host adaptation. No blocking defect found. Imported confidence is restricted to high/medium/low; evidence accepts strings; missing metadata remains absent. Existing location layout is retained and optional confidence uses subdued styling. Evidence is preserved, not displayed, as requested by this slice.
All 17 native review threads and replies read: author notes only, no qa findings or human requests. No prior defect findings to recheck.
Truth: 85/100 for contract, parser and rendering behavior, exceeding configured 70. Live pixel layout was not observed.

Screenshots not captured: TCC denial documented in v1. Owner issue #4 ruling waives three-resolution screenshots in this host class and accepts programmatic display assertions; issue #11 owner handoff explicitly invokes that ruling. Alternatives are real renderer fixtures and committed owner host logs. No visual screenshot proof claimed.
Test gaps (not written): Medium live DOM/layout, resolved-confidence description and empty/Unicode/long evidence boundaries; Low focus/visual polish. No High gap requiring application changes found. Native Windows test remains skipped on macOS.
