/* zcode-workflow
description: "Drain one super-board wave — pre-flight, classify, then build → qa → review per card (lifecycles per run.md). ZCode dynamic-workflows port of the upstream Claude Code wave script: typed asks replace JSON schemas, named subagents replace label/phase options, the pipeline helper is unrolled, and model-tier ladders collapse to the session model."
whenToUse: "Launched by the super-board run-workflow backend with args from super-board-wave-plan.sh. Not for direct ad-hoc use."
args:
  configPath:
    type: string
    required: true
    description: "Path to the active super-board config json (.claude/super-board/configs/<slug>.json)"
  cards:
    type: json
    required: true
    description: "Planner output cards, each {number, status, title, lane, labels}"
  humanApprovesMerge:
    type: boolean
    default: false
    description: "Human approves every merge — Review parks cards instead of merging"
  repo:
    type: string
    default: ""
    description: "The GitHub repo slug (owner/name) every gh call targets — pinned so lanes never guess the owner"
  tier:
    type: string
    default: ""
    description: "Model ladder low|medium|high — accepted for compatibility; on ZCode every lane runs the session model"
*/
interface Card {
  number: number;
  status: string;
  title: string;
  lane?: string;
  labels?: string[];
}

interface ClassifyResult {
  kind: "feature" | "bug" | "qa";
  status?: "ok" | "halted";
  complexity: "low" | "medium" | "high";
}

interface PriorFindings {
  fixed: number;
  notFixed: number;
  noLongerApplies: number;
}

interface StageResult {
  status: "advanced" | "bounced" | "blocked" | "human-gate" | "failed" | "halted";
  column: string;
  detail: string;
  prUrl?: string;
  branch?: string;
  priorFindings?: PriorFindings;
}

interface Verdict {
  number: number;
  verdict: "proceed" | "hold" | "sequence" | "skipped" | "halted";
  column?: string;
  blockedBy?: number[];
  detail: string;
}

interface PreflightResult {
  verdicts: Verdict[];
}

interface LaneHistoryEntry {
  lane: string;
  status: string;
  column: string;
  detail: string;
  prUrl?: string;
  priorFindings?: StageResult["priorFindings"];
}

interface CardOutcome {
  number: number;
  history: LaneHistoryEntry[];
}

interface WaveSummary {
  number: number;
  finalStatus: string;
  lastLane: string;
  column: string;
  detail: string;
  prUrl: string | null;
  priorFindings: PriorFindings | null;
  lanesRun: string;
}

// The harness can deliver `args` as a JSON-encoded string — normalize, then validate.
const input = (() => {
  const a = args as unknown;
  if (typeof a !== "string") return (a ?? {}) as Record<string, unknown>;
  try {
    return JSON.parse(a) as Record<string, unknown>;
  } catch {
    throw new Error("super-board-wave: args arrived as a string but was not valid JSON");
  }
})();
const cardsIn = input.cards as Card[] | undefined;
const configPath = input.configPath as string | undefined;
if (!cardsIn || !Array.isArray(cardsIn) || !configPath) {
  throw new Error("super-board-wave needs args {configPath, cards:[{number,status,title,lane}]}");
}
const repo = typeof input.repo === "string" && input.repo.includes("/") ? input.repo : "";
const REPO_PIN = repo
  ? `The GitHub repo for EVERY gh call is ${repo} — pass -R ${repo} on issue/pr commands and spell repos/${repo}/… in api paths. NEVER guess the owner from your username or environment.`
  : "";
const tier = typeof input.tier === "string" ? input.tier : "";
if (tier && !["low", "medium", "high"].includes(tier)) {
  throw new Error(`super-board-wave: unknown tier "${tier}" — use low | medium | high`);
}
// `variant` was removed in v3.0.0; the planner refuses a "qa-only" config, so a
// wave launched with one is a stale caller. Refuse rather than guess.
if (input.variant && input.variant !== "full") {
  throw new Error(`super-board-wave: variant "${String(input.variant)}" was removed in v3.0.0 — labels route cards; run /super-board onboard to upgrade`);
}
log(`wave: ${cardsIn.length} cards — ${cardsIn.map((c) => `#${c.number}`).join(", ")}`);

let halted = false;
// Valid form per --kind, from validate() in scripts/super-board-github-read.py (#32).
const READ_SHAPES = [
  `Read shapes (helper: .claude/bin/super-board-github-read.py --kind <kind> -- <gh args>):`,
  `- issue title+body: --kind issue -- issue view <N> --json number,title,body`,
  `- issue comments: --kind comments -- api repos/{owner}/{repo}/issues/<N>/comments --paginate --slurp (zero comments = [[]])`,
  `- other JSON, incl. maybe-empty lists: --kind json -- <gh args> (no --jq that prints a plain string)`,
  `- PR branch+head: --kind head -- pr view <N> --json headRefName,headRefOid --jq '"\\(.headRefName) \\(.headRefOid)"'`,
  `- PR body+head: --kind body -- pr view <N> --json body,headRefOid`,
  `- PR metadata: --kind metadata -- pr view <N> --json files,labels,body,additions,deletions,changedFiles`,
  `- issue state: --kind state -- issue view <N> --json state --jq .state`,
  `A read whose output misses its shape exits 64 for that call only and prints the valid form: fix the read, do not halt.`,
].join("\n");
const READ_FAILURE_PIN = () => (REPO_PIN ? REPO_PIN + "\n" : "") + READ_SHAPES + "\n" + `Required GitHub reads use .claude/bin/super-board-github-read.py: three total attempts, exit 79 means run halted. Check --check before any GitHub write, migration, or merge. On exit 79 preserve worktree/card/approval/claims, make no more GitHub calls, and report status=halted (preflight verdict=halted). Never retry a mutation. Config: ${configPath}.`;

const LANE: Record<string, { skill: string; section: string }> = {
  build: { skill: "super-build", section: "Builder" },
  qa: { skill: "super-qa", section: "Tester" },
  review: { skill: "super-review", section: "Reviewer" },
};

// Review remembers: a card back in Review after a bounce is graded against the
// last Reviewer report first (run.md → Reviewer step 3b). The lookup is one gh
// call by marker, so the lane does it — this script never sees PR comments.
const REVIEW_MEMORY = [
  `Before reviewing, load prior_report: the newest PR comment containing "<!-- super-review:report -->" (run.md → Reviewer step 3b).`,
  `None → first review, behave as usual. Found → round 1 marks each prior finding fixed / not fixed / no longer applies;`,
  `any not fixed → bounce again listing them. Edit that report comment in place (keep R-ids), never post a second one. Report the counts as priorFindings.`,
  `Read the issue ACs and the diff before the builder's PR summary; form your own hypotheses, then check their claims.`,
  `Class every finding Gap / Bug / Verification miss / Scope drift / Over-engineering, and list what you verified correct.`,
  `Run ponytail:ponytail-review on the merge-base diff (inline ladder if the plugin is absent); Over-engineering never blocks merge alone.`,
  `Truth-check sub-agents get the fixed brief from super-review → "Adversarial mode", verbatim. After collecting, reclass any Over-engineering Blocker to Should fix; it never decides merge or bounce.`,
  `Merge only via super-board-merge-gate.sh. Exit 7 = merge_policy says a human merges (money/auth/schema/size): Blocked with the 🙋 template quoting its human-gate lines; To unblock = merge it yourself, or comment done to approve.`,
  `Exit 8 = 🙋 needs you (migration for a DB the robot may not touch, failed migrate, declared human step): Blocked with the 🙋 template, exact commands from its needs-you lines, label needs-you.`,
];

// GitHub budget (rate-limit-etiquette.md → "Price list").
const BOARD_IO = () =>
  `Board moves and reads: .claude/bin/super-board-card.sh --config ${configPath} move <issue> <Status> ` +
  `(1 GraphQL point) · status <issue> · items. Comments, labels, PR reads: REST per .claude/skills/super-board/references/rate-limit-etiquette.md → "Price list". Read GitHub once per decision, never in a sleep loop.`;

const laneAgent = (lane: string, card: Card) => {
  const meta = LANE[lane];
  return agent(`${meta.section.toLowerCase()}-${card.number}`, {
    system: [
      READ_FAILURE_PIN(),
      `You are the ${meta.section} lane of a super-board wave. You do the whole ${meta.section} lifecycle for one card, yourself, with your own tools.`,
      BOARD_IO(),
      `Commits, PR title, PR body blocks, comments: .claude/skills/super-board/references/writing-standard.md. Rewrite only your own PR body blocks, with .claude/bin/super-board-pr-body.sh.`,
      `If a required check or service is impossible to reach, or your instructions contradict each other, report status=halted plainly rather than working around it.`,
    ].join("\n"),
  });
};

const laneAsk = (lane: string, card: Card) =>
  [
    `Run ${LANE[lane].skill} on issue #${card.number} ("${card.title}") for a super-board workflow wave.`,
    `Read .claude/skills/super-board/references/run.md → "${LANE[lane].section}" lifecycle and follow it EXACTLY:`,
    `create your own worktree under .claude/worktrees/, work on the issue branch, post the required PR/issue comments,`,
    `move the project card yourself, clean up the worktree on exit. Config: ${configPath}.`,
    ...(lane === "review" ? REVIEW_MEMORY : []),
    ...(lane === "qa" && card.status === "Ready"
      ? [`This card is labelled qa: it skips Building. Move it Ready → QA yourself, create the issue branch from the base branch, and test what is already there (run.md → "qa cards").`]
      : []),
    ``,
    `Report your exit via structured output:`,
    `- status=advanced  → card moved forward (Building→QA, QA→Review, Review→Done/merged)`,
    `- status=bounced   → card moved backward (QA fail → Ready, Reviewer bounce → Ready/QA)`,
    `- status=blocked or human-gate → you wrote the Block template and moved the card to Blocked`,
    `- status=halted    → required service evidence is unavailable; leave card state unchanged and stop the run`,
    `- status=failed    → you could not complete the lifecycle (say why in detail)`,
    `column = the column the card is in when you exit. detail = one line. Include prUrl/branch when they exist.`,
  ].join("\n");

// On ZCode every lane runs the session model — the upstream haiku/sonnet/opus
// ladders name Claude Code model aliases this host does not have. `tier` is
// still accepted and validated above, so the run contract is unchanged.
const runLane = async (lane: string, card: Card, history: LaneHistoryEntry[]): Promise<StageResult> => {
  if (halted) {
    const result: StageResult = { status: "halted", column: card.status, detail: "run halted by a required GitHub read failure" };
    history.push({ lane, ...result });
    return result;
  }
  const laneR = laneAgent(lane, card);
  let result: StageResult;
  try {
    result = await laneR.ask<StageResult>(laneAsk(lane, card));
  } catch {
    result = { status: "failed", column: "unknown", detail: `${lane} agent returned no result` };
  }
  if (!result || typeof result.status !== "string") {
    result = { status: "failed", column: "unknown", detail: `${lane} agent returned no result` };
  }
  if (result.status === "halted") halted = true;
  history.push({ lane, ...result });
  return result;
};

// Builder pre-flight (run.md → "Builder pre-flight"). Before ANY Ready card
// reaches runLane('build'), a fresh cheap agent asks: already merged? already
// being built (open PR or another card)? same files as an open PR? unclear?
// One agent per batch of PREFLIGHT_BATCH cards, so the three gh list calls in
// super-board-preflight.sh are paid once per batch, not once per card.
const PREFLIGHT_BATCH = 5;

const preflightAgent = (batch: Card[]) => {
  const id = batch.map((c) => c.number).join("-");
  return agent(`preflight-${id}`, {
    system: [
      READ_FAILURE_PIN(),
      `You are the Builder pre-flight of a super-board wave: you write no code, you only decide which Ready cards may start building.`,
      BOARD_IO(),
      `If GitHub evidence is unavailable, return a halted verdict plainly rather than guessing.`,
    ].join("\n"),
  });
};

const preflightAsk = (batch: Card[]) =>
  [
    REPO_PIN + `Builder pre-flight for issues ${batch.map((c) => `#${c.number} ("${c.title}")`).join(", ")}. Config: ${configPath}.`,
    `Read .claude/skills/super-board/references/run.md → "Builder pre-flight" and follow it EXACTLY. You write no code.`,
    `Other cards in this wave: ${JSON.stringify(cardsIn.map(({ number, status, title }) => ({ number, status, title })))}`,
    `Run .claude/bin/super-board-preflight.sh once for the whole batch, then judge its candidates semantically.`,
    `hold / sequence-behind → post the Block template (block-template.md) and move the card to Blocked yourself.`,
    `Two Ready cards overlapping each other with no open PR: the lower-numbered one proceeds; sequence only the other, blockedBy [the lower]. Never both.`,
    `A sequence with nothing to wait on (empty blockedBy) leaves the card in Ready: return column Ready and it builds.`,
    `Return one verdict per issue: proceed | hold | sequence | skipped (pre-flight blind). Never drop a card silently.`,
  ].join("\n");

const labelsOf = (card: Card): string[] => (card.labels || []).map((l) => String(l).toLowerCase());
const readyLane = (card: Card): string => card.lane || (labelsOf(card).includes("qa") ? "qa" : "build");

// Only cards the Builder will take are pre-flighted; `qa` cards skip Building.
const ready = cardsIn.filter((c) => c.status === "Ready" && readyLane(c) === "build");
const verdicts = new Map<number, Verdict>();
const batches: Card[][] = [];
for (let i = 0; i < ready.length; i += PREFLIGHT_BATCH) batches.push(ready.slice(i, i + PREFLIGHT_BATCH));

phase("Pre-flight each build card");
if (batches.length === 0) {
  log("no build-lane cards to pre-flight");
} else {
  await Promise.all(
    batches.map(async (batch) => {
      const r = await preflightAgent(batch).ask<PreflightResult>(preflightAsk(batch));
      for (const v of (r && r.verdicts) || []) {
        verdicts.set(v.number, v);
        if (v.verdict === "halted") halted = true;
      }
    }),
  );
}
// sequence with nothing to wait on = proceed with a conflict note (the agent posted it).
// No column and an empty blockedBy is the same case: nothing to wait on never parks a
// card (2026-10-03: #180/#181 each "sequenced" behind the other, neither built).
const preflightGo = (card: Card): boolean => {
  const v = verdicts.get(card.number);
  if (!v) return false;
  if (v.verdict === "proceed") return true;
  return v.verdict === "sequence" && (v.column === "Ready" ||
    (!v.column && Array.isArray(v.blockedBy) && v.blockedBy.length === 0));
};
const preflightExit = (card: Card): LaneHistoryEntry => {
  const v = verdicts.get(card.number) ||
    { number: card.number, verdict: "skipped", detail: "pre-flight returned no verdict — not built unchecked; retried next wave" };
  return {
    lane: "preflight",
    status: v.verdict === "halted" ? "halted" : v.verdict === "skipped" ? "failed" : "blocked",
    column: v.column || (["skipped", "halted"].includes(v.verdict) ? "Ready" : "Blocked"),
    detail: `${v.verdict}: ${v.detail}`,
  };
};

// Per-card pipeline, unrolled from the upstream pipeline() helper: classify
// (cards entering at Ready), then the lane chain — entry point depends on the
// card's current column. A non-'advanced' exit ends the chain; the next wave
// re-selects the card from wherever it landed (the board is the loop state).
const runCard = async (card: Card): Promise<CardOutcome> => {
  const history: LaneHistoryEntry[] = [];
  if (halted) {
    return { number: card.number, history: [{ lane: "none", status: "halted", column: card.status, detail: "run halted; preserve current work and resume explicitly" }] };
  }

  let cls: ClassifyResult | null = null;
  if (card.status === "Ready") {
    const labels = labelsOf(card);
    const typed = ["qa", "bug", "feature"].find((l) => labels.includes(l));
    const classifier = agent(`classifier-${card.number}`, {
      system: READ_FAILURE_PIN() + "\nYou classify one super-board card. You do not build anything.",
    });
    try {
      cls = await classifier.ask<ClassifyResult>(
        READ_FAILURE_PIN() + "\n" + `Read GitHub issue #${card.number} ("${card.title}") — body (--kind issue) and all comments (--kind comments) — with the read shapes above. ` +
        `Classify it: kind (feature|bug|qa) and complexity (low|medium|high) judged by the scope of change required. ` +
        (typed
          ? `Its label says "${typed}": return kind "${typed}" — the label routes the card, you never override it.`
          : `It has no type label, so it is built (no label = Building). Return feature or bug — never qa, ` +
            `which only a person sets — and add that label: gh issue edit ${card.number} --add-label <kind>.`),
      );
    } catch {
      cls = null;
    }
    if (cls && cls.status === "halted") halted = true;
  }

  let at = card.status;
  if (at === "Ready" && readyLane(card) === "build") {
    if (!preflightGo(card)) {
      history.push(preflightExit(card));
      return { number: card.number, history };
    }
    const b = await runLane("build", card, history);
    if (b.status !== "advanced") return { number: card.number, history };
    at = "QA";
  }
  // A `qa`-labelled card skips Building: Ready → QA, Tester first
  // (run.md "Lanes and label routing").
  if (at === "Ready" && readyLane(card) === "qa") at = "QA";
  if (at === "QA") {
    const q = await runLane("qa", card, history);
    if (q.status !== "advanced") return { number: card.number, history };
    at = "Review";
  }
  if (at === "Review") {
    await runLane("review", card, history);
  }
  return { number: card.number, history };
};

phase("Classify, then run the lanes per card");
const results = (await Promise.all(cardsIn.map((card) => runCard(card)))).filter(Boolean);

const summary: WaveSummary[] = results.map((r) => {
  const last: LaneHistoryEntry = r.history[r.history.length - 1] ||
    { lane: "none", status: "failed", column: "unknown", detail: "no lane ran" };
  return {
    number: r.number,
    finalStatus: last.status,
    lastLane: last.lane,
    column: last.column,
    detail: last.detail,
    prUrl: last.prUrl || null,
    priorFindings: last.priorFindings || null,
    lanesRun: r.history.map((h) => `${h.lane}:${h.status}`).join(" → ") || "none",
  };
});

artifact.board("wave", {
  title: "Wave result per card",
  key: "number",
  status: "column",
  columns: ["Ready", "Building", "QA", "Review", "Blocked", "Done"],
  cardTitle: "number",
  detail: [{ field: "finalStatus", label: "status" }, { field: "lanesRun", label: "lanes" }],
});
for (const s of summary) report(s, "wave");

log(`wave complete: ${summary.length} cards — ` +
  summary.map((s) => `#${s.number}=${s.finalStatus}@${s.column}`).join(", "));

return {
  conclusion: `Wave done: ${summary.length} cards — ` +
    summary.map((s) => `#${s.number}=${s.finalStatus}@${s.column}`).join(", ") +
    (halted ? " · HALTED by a required GitHub read failure" : ""),
  cards: summary,
  halted,
  verified: ["each card's exit came from its lane agent's structured result; board columns are what the lanes moved cards to"],
  notCovered: ["merge gate outcomes — this board is human-merges (cards park in Review)", "model-tier ladders — collapsed to the session model on this host"],
};
