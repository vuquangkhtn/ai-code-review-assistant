# /super-plan

Conducts a request through the mapped plan/design skills and files approved board cards, so
`/super-board run` can drain them. The front of the pipeline, without the bottleneck.

## What It Does

- **Routes by the map, not by memory.** Reads `.claude/super-board/skill-map.json` (written by
  onboard) to pick the installed set's plan/design skills; degrades gracefully where a set
  lacks a step and never hardcodes one set's skill names.
- **Sharp path first.** An already-clear request skips the interviews and goes straight to
  card drafting. Opt-in by design: `/super-board run` never requires super-plan.
- **Strict human-in-the-loop.** super-plan picks the skills and asks the questions; it never
  answers its own questions and never declares "all clear" without the user.
- **Draft-then-file.** Board-format drafts (Problem · Context · Fix · checkable ACs · Risk ·
  Blocked by) with suggested `qa`/`bug`/`feature` labels are shown in-chat; cards are filed to
  Backlog (or Ready, on your say-so) only after you approve. The decision summary stays
  in-chat — the filed cards are the only surviving state.
- **Knows its ceiling.** A huge multi-session effort is handed off to `wayfinder` (its map of
  decision tickets stays the tool for that); super-plan never builds, tests or merges product
  code — the board's lanes own all of that.

## Usage

| Command | Does |
|---|---|
| `/super-plan` | Orient → Clarify (if foggy) → Route → Design (medium) → Draft cards → Review + file |
| `/super-plan <request>` | same, with the request text up front |
| `/super-plan --draft-only` | show the drafts; never file |

## Install

Ships in the super-board pack under `skills/super-plan/`; `install.sh` copies it to
`.claude/skills/super-plan/`. Needs a super-board onboard (`skill-map.json` + config) for
skill routing; without one it still drafts and files, and says routing is unavailable.

## Status

#18 shipped the sharp path — Orient · Draft cards · Review + file. #19 added Clarify (the mapped
interview skills, never self-answered) and Route (small/medium/huge by wayfinder's fog test,
confirmed by the user; huge hands off to `wayfinder` and stops). #20 completes the recipe with
Design — the mapped design skills produce the prototype / structure sketch / spec the request
needs, throwaway-only, and the user reacts to the artifacts before any card is drafted.
