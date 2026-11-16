#!/usr/bin/env python3
"""super-board-agents-md.py — the deterministic half of the AGENTS.md step.

super-board onboard makes AGENTS.md the single source of truth for coding agents
and CLAUDE.md a one-line `@AGENTS.md` pointer. The semantic merge (which rules
are duplicates, which conflict, how to word them) is the agent's job, with the
rules in references/onboard.md → "AGENTS.md source of truth". Everything that
must be exact lives here: detection, backup, the managed block, atomic writes,
the lossless-coverage check and the size check. Stdlib only.

    detect   [--root .]                         JSON: what exists, pointer or not, block or not
    backup   [--root .]                         copy every instruction file to
                                                .claude/super-board/backup/<ts>/; print the dir
    block    [--root .] [--file AGENTS.md] [--template T] [--version V] [--create]
                                                write the super-board block between the markers;
                                                nothing outside them changes. Prints
                                                created | inserted | updated | unchanged
    pointer  [--root .] [--tail FILE] [--force] CLAUDE.md := "@AGENTS.md" (+ Claude-only tail).
                                                Refuses to replace a non-pointer CLAUDE.md
                                                without --force (use after backup + approval)
    write    --src S --dest D                   atomic copy (temp file, fsync, rename)
    units    --file F [--file F2 ...]           JSON list of rule units: {id, file, heading, text}
    coverage --units U.json --target F [--target F2]
                                                every unit must carry `maps_to` (a line present
                                                in a target) or `dropped` (the user's reason).
                                                Exit 1 listing each unmapped unit
    check    --file F [--max-lines 200]         one marker pair at most, ≤ max lines. Exit 1 if not
    skill-map [--root .] [--file AGENTS.md]     from .agents/skill-sets.json (what install.sh put
                                                down) plus the chosen mapping (--named SET for a
                                                whole-set choice, --steps FILE for custom
                                                {"plan":"pstack",...}) and --agents a,b:
                                                write .claude/super-board/skill-map.json and
                                                refresh the <!-- super-board:skill-map --> block
                                                in AGENTS.md. Prints created | updated | unchanged

Markers: `<!-- super-board:begin vX.Y.Z (managed; edits inside are overwritten on
upgrade) -->` … `<!-- super-board:end -->`, plus the independent
`<!-- super-board:skill-map begin (managed) -->` … `<!-- super-board:skill-map end -->`
pair written by `skill-map`. Exit codes: 0 ok, 1 check failed,
2 refused / bad input, 64 usage.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
# Same relative layout in the pack (scripts/ + skills/) and installed (.claude/bin + .claude/skills).
DEFAULT_TEMPLATE = HERE.parent / "skills" / "super-board" / "references" / "agents-md-block.md"
DEFAULT_VERSION_FILE = HERE.parent / "skills" / "super-board" / "VERSION"
BEGIN_RE = re.compile(r"^<!-- super-board:begin\b.*-->\s*$")
END_RE = re.compile(r"^<!-- super-board:end -->\s*$")
MAP_BEGIN_RE = re.compile(r"^<!-- super-board:skill-map begin\b.*-->\s*$")
MAP_END_RE = re.compile(r"^<!-- super-board:skill-map end -->\s*$")
INSTRUCTION_FILES = ["AGENTS.md", "CLAUDE.md", ".claude/CLAUDE.md", "CLAUDE.local.md",
                     "GEMINI.md", ".cursorrules", ".github/copilot-instructions.md"]
POINTER = "@AGENTS.md"
LIFECYCLE_STEPS = ["plan", "design", "build", "test", "deploy", "maintain"]
STEP_TITLES = {"plan": "Plan", "design": "Design", "build": "Build",
               "test": "Test", "deploy": "Deploy", "maintain": "Maintain"}
# How each agent reaches an installed skill. copilot and other have no skill
# loader — AGENTS.md (this block) is the pass-through, which is why the block
# exists even for hosts that record nothing else.
AGENT_NOTES = {
    "claude": "slash commands (`/tdd`) and the Skill tool, from .claude/skills",
    "codex": "type `$skill-name`; skills are found in .agents/skills (symlinks followed)",
    "opencode": "reads .agents/skills natively",
    "zcode": "reads .agents/skills natively",
    "copilot": "no skill loader — open .agents/skills/<name>/SKILL.md and follow it",
    "other": "no skill loader — open .agents/skills/<name>/SKILL.md and follow it",
}


def die(msg: str, code: int = 2) -> None:
    print(f"agents-md: {msg}", file=sys.stderr)
    sys.exit(code)


def atomic_write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(text)
            f.flush()
            os.fsync(f.fileno())
        if path.exists():
            shutil.copymode(path, tmp)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def markers(lines: list[str]) -> list[tuple[int, int]]:
    """(begin, end) line-index pairs of managed blocks."""
    pairs, start = [], None
    for i, l in enumerate(lines):
        if BEGIN_RE.match(l):
            start = i
        elif END_RE.match(l) and start is not None:
            pairs.append((start, i))
            start = None
    return pairs


def is_pointer(text: str) -> bool:
    first = next((l.strip() for l in text.splitlines() if l.strip()), "")
    return first == POINTER


def pointer_tail(text: str) -> str:
    lines = text.splitlines()
    for i, l in enumerate(lines):
        if l.strip():
            return "\n".join(lines[i + 1:]).strip("\n")
    return ""


def cmd_detect(a) -> int:
    root = Path(a.root)
    out = {"files": {}, "agents": None, "claude": None}
    for rel in INSTRUCTION_FILES:
        p = root / rel
        if p.is_file():
            text = p.read_text(encoding="utf-8", errors="replace")
            out["files"][rel] = {"lines": len(text.splitlines()), "bytes": len(text.encode())}
    if (root / "AGENTS.md").is_file():
        text = (root / "AGENTS.md").read_text(encoding="utf-8", errors="replace")
        pairs = markers(text.splitlines())
        out["agents"] = {"has_block": bool(pairs), "blocks": len(pairs),
                         "lines": len(text.splitlines())}
    if (root / "CLAUDE.md").is_file():
        text = (root / "CLAUDE.md").read_text(encoding="utf-8", errors="replace")
        out["claude"] = {"is_pointer": is_pointer(text),
                         "imports": re.findall(r"^@(\S+)", text, re.M),
                         "tail_lines": len(pointer_tail(text).splitlines()) if is_pointer(text) else None}
    # The one question onboard re-asks on every re-install: is there a CLAUDE.md
    # holding rules of its own that AGENTS.md does not?
    out["offer_merge"] = bool(out["claude"] and not out["claude"]["is_pointer"])
    print(json.dumps(out, indent=2))
    return 0


def cmd_backup(a) -> int:
    root = Path(a.root)
    dest = root / ".claude" / "super-board" / "backup" / time.strftime("%Y%m%d-%H%M%S")
    n = 0
    for rel in INSTRUCTION_FILES:
        p = root / rel
        if p.is_file():
            (dest / rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dest / rel)
            n += 1
    if n == 0:
        print("nothing to back up")
        return 0
    print(dest)
    return 0


def render_block(template: Path, version: str) -> list[str]:
    if not template.is_file():
        die(f"block template not found: {template}")
    body = template.read_text(encoding="utf-8").strip("\n").splitlines()
    return ([f"<!-- super-board:begin v{version} (managed; edits inside are overwritten on upgrade) -->"]
            + body + ["<!-- super-board:end -->"])


def cmd_block(a) -> int:
    root = Path(a.root)
    path = root / a.file
    version = a.version or (DEFAULT_VERSION_FILE.read_text().strip()
                            if DEFAULT_VERSION_FILE.is_file() else "0.0.0")
    block = render_block(Path(a.template) if a.template else DEFAULT_TEMPLATE, version)
    if not path.exists():
        if not a.create:
            die(f"{path} does not exist (pass --create to start one)")
        atomic_write(path, "# AGENTS.md\n\n" + "\n".join(block) + "\n")
        print("created")
        return 0
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    pairs = markers(lines)
    if len(pairs) > 1:
        die(f"{path} has {len(pairs)} super-board blocks; leave exactly one and re-run")
    if any(BEGIN_RE.match(l) for l in lines) and not pairs:
        die(f"{path} has a super-board:begin marker with no end marker; fix it by hand")
    if pairs:
        b, e = pairs[0]
        new = lines[:b] + block + lines[e + 1:]
        verdict = "updated"
    else:
        new = lines + ([""] if lines and lines[-1].strip() else []) + block
        verdict = "inserted"
    new_text = "\n".join(new) + "\n"
    if new_text == text:
        print("unchanged")
        return 0
    atomic_write(path, new_text)
    print(verdict)
    return 0


def cmd_pointer(a) -> int:
    path = Path(a.root) / "CLAUDE.md"
    tail = Path(a.tail).read_text(encoding="utf-8").strip("\n") if a.tail else ""
    if path.exists():
        current = path.read_text(encoding="utf-8")
        if not is_pointer(current) and not a.force:
            die("CLAUDE.md holds its own rules; merge them into AGENTS.md, back up, then pass --force")
    text = POINTER + "\n" + (f"\n{tail}\n" if tail else "")
    if path.exists() and path.read_text(encoding="utf-8") == text:
        print("unchanged")
        return 0
    atomic_write(path, text)
    print("written")
    return 0


def cmd_write(a) -> int:
    src = Path(a.src)
    if not src.is_file():
        die(f"source not found: {src}")
    atomic_write(Path(a.dest), src.read_text(encoding="utf-8"))
    print(f"wrote {a.dest}")
    return 0


def split_units(path: Path) -> list[dict]:
    """Heading path + one bullet, table row, paragraph or code fence per unit.
    Text inside the super-board managed block is skipped: it is regenerated."""
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    units, heads, buf, kind = [], [], [], None
    in_block = in_fence = False

    def flush():
        nonlocal buf, kind
        text = "\n".join(buf).strip()
        if text and text != POINTER:
            units.append({"file": str(path), "heading": " > ".join(h for _, h in heads), "text": text})
        buf, kind = [], None

    for l in lines:
        if BEGIN_RE.match(l):
            flush(); in_block = True; continue
        if END_RE.match(l):
            in_block = False; continue
        if in_block:
            continue
        if l.strip().startswith("```"):
            if in_fence:
                buf.append(l); in_fence = False; flush(); continue
            flush(); in_fence = True; kind = "fence"; buf.append(l); continue
        if in_fence:
            buf.append(l); continue
        m = re.match(r"^(#{1,6})\s+(.*)$", l)
        if m:
            flush()
            level = len(m.group(1))
            heads = [(lv, h) for lv, h in heads if lv < level] + [(level, m.group(2).strip())]
            continue
        if not l.strip():
            flush(); continue
        if re.match(r"^\s*\|", l):
            flush()
            if re.match(r"^\s*\|[\s:|-]+\|\s*$", l):
                continue  # separator row
            buf.append(l); flush(); continue
        if re.match(r"^\s*(?:[-*+]|\d+[.)])\s+", l) and not l.startswith(("    ", "\t")):
            flush(); kind = "bullet"; buf.append(l); continue
        if kind == "bullet" and l.startswith((" ", "\t")):
            buf.append(l); continue
        if kind == "bullet":
            flush()
        kind = kind or "para"
        buf.append(l)
    flush()
    return units


def cmd_units(a) -> int:
    out = []
    for f in a.file:
        out += split_units(Path(f))
    for i, u in enumerate(out, 1):
        u["id"] = f"U{i}"
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def cmd_coverage(a) -> int:
    units = json.load(open(a.units))
    target_lines = set()
    for t in a.target:
        if Path(t).is_file():
            target_lines |= {norm(l) for l in Path(t).read_text(encoding="utf-8").splitlines() if l.strip()}
    gaps = []
    for u in units:
        if u.get("dropped"):
            continue
        maps = u.get("maps_to")
        if not maps:
            gaps.append(f"{u.get('id', '?')}: no maps_to and not dropped — {norm(u.get('text', ''))[:80]}")
        elif norm(maps) not in target_lines:
            gaps.append(f"{u.get('id', '?')}: maps_to line not found in targets — {norm(maps)[:80]}")
    if gaps:
        print("\n".join(gaps))
        print(f"coverage: {len(gaps)} of {len(units)} rule unit(s) unmapped", file=sys.stderr)
        return 1
    dropped = sum(1 for u in units if u.get("dropped"))
    print(f"coverage: {len(units)} rule unit(s) mapped ({dropped} dropped on purpose)")
    return 0


def cmd_check(a) -> int:
    path = Path(a.file)
    if not path.is_file():
        die(f"{path} not found")
    lines = path.read_text(encoding="utf-8").splitlines()
    problems = []
    begins = sum(1 for l in lines if BEGIN_RE.match(l))
    ends = sum(1 for l in lines if END_RE.match(l))
    if begins > 1 or ends > 1 or begins != ends:
        problems.append(f"marker pairs: {begins} begin / {ends} end (want at most one pair)")
    if len(lines) > a.max_lines:
        problems.append(f"{len(lines)} lines > {a.max_lines}: move detail to docs/agents/*.md and leave a pointer")
    if problems:
        print("\n".join(problems))
        return 1
    print(f"ok: {len(lines)} lines")
    return 0


def load_record(root: Path) -> dict:
    path = root / ".agents" / "skill-sets.json"
    if not path.is_file():
        die(f"{path} not found — run install.sh with --sets first")
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_steps(record: dict, named: str | None, steps_file: str | None) -> tuple[dict, str]:
    """step → {set, skills} from the install record plus the onboard choice."""
    by_name = {s["name"]: s for s in record.get("sets", [])}
    if named is not None:
        if named == "custom":
            die("--named custom is not a set; pass --steps FILE for the per-step choices")
        if named not in by_name:
            die(f"--named {named}: not in the install record ({', '.join(sorted(by_name))})")
        mode = "named"
        chosen = {step: named for step in LIFECYCLE_STEPS}
    else:
        if not steps_file:
            die("pass --named SET or --steps FILE")
        picks = json.loads(Path(steps_file).read_text(encoding="utf-8"))
        bad = [k for k in picks if k not in LIFECYCLE_STEPS]
        if bad:
            die(f"--steps file has unknown step(s): {', '.join(sorted(bad))}")
        mode = "custom"
        chosen = {step: picks.get(step, "") for step in LIFECYCLE_STEPS}
        unknown = {v for v in chosen.values() if v and v not in by_name}
        if unknown:
            die(f"--steps names set(s) not in the install record: {', '.join(sorted(unknown))}")
    steps_out = {}
    for step in LIFECYCLE_STEPS:
        setname = chosen[step]
        if setname:
            skills = by_name[setname].get("steps", {}).get(step, [])
            steps_out[step] = {"set": setname, "skills": skills}
        else:
            steps_out[step] = {"set": None, "skills": []}
    return steps_out, mode


def render_skill_map(steps: dict, mode: str, named: str | None, record: dict,
                     agents: list[str], other_note: str) -> list[str]:
    by_name = {s["name"]: s for s in record.get("sets", [])}
    lines = ["<!-- super-board:skill-map begin (managed) -->",
             "## Skill sets & lifecycle map",
             "",
             "Which vendored skill set serves each lifecycle step, and how each agent reaches a skill.",
             ""]
    if mode == "named":
        meta = by_name[named]
        lines.append(f"Skill set: **{named}** — {meta.get('title', named)} "
                     f"(source: {meta.get('source', '?')}, pinned: {meta.get('pinned_ref', '?')}).")
    else:
        picked = sorted({s for s in (v["set"] for v in steps.values()) if s})
        lines.append("Skill sets per step (custom): " + ", ".join(picked) + ".")
    lines += ["", "Machine-readable map: `.claude/super-board/skill-map.json` · "
                  "install record: `.agents/skill-sets.json`.", ""]
    lines += ["| Step | Set | Skills |", "|---|---|---|"]
    for step in LIFECYCLE_STEPS:
        entry = steps[step]
        if entry["set"]:
            lines.append(f"| {STEP_TITLES[step]} | {entry['set']} | {', '.join(entry['skills']) or '—'} |")
        else:
            lines.append(f"| {STEP_TITLES[step]} | super-board loop | no skill set chosen — "
                         "the board's own collect/calibration loop covers it |")
    for setname in sorted({v['set'] for v in steps.values() if v['set']}):
        meta = by_name[setname]
        if meta.get("maintain_fallback"):
            lines.append("")
            lines.append(meta["maintain_fallback"])
        if meta.get("anytime"):
            lines.append("")
            lines.append(f"{setname} anytime skills: {', '.join(meta['anytime'])}")
    lines += ["", "Agents: " + "; ".join(AGENT_NOTES.get(a, a) for a in agents) + "."]
    if other_note:
        lines.append(f"Other agents: {other_note}")
    lines.append("<!-- super-board:skill-map end -->")
    return lines


def cmd_skill_map(a) -> int:
    root = Path(a.root)
    record = load_record(root)
    steps, mode = resolve_steps(record, a.named, a.steps)
    named = a.named if mode == "named" else None
    agents = [h for h in (a.agents.split(",") if a.agents else record.get("hosts", ["claude"])) if h]
    if "claude" not in agents:
        agents = ["claude"] + agents
    other_note = a.other_note or ""

    # 1. machine-readable map next to the onboard config
    map_path = root / ".claude" / "super-board" / "skill-map.json"
    payload = {"version": 1, "mode": mode, "named": named, "steps": steps,
               "agents": agents, "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
               "record": {k: v for k, v in record.items() if k != "sets"},
               "sets": {name: {kk: meta[kk] for kk in ("source", "pinned_ref", "license", "steps", "anytime", "maintain_fallback") if kk in meta}
                        for name, meta in ((s["name"], s) for s in record.get("sets", []))}}
    map_existed = map_path.is_file()
    if not map_existed or map_path.read_text(encoding="utf-8") != json.dumps(payload, indent=2) + "\n":
        atomic_write(map_path, json.dumps(payload, indent=2) + "\n")

    # 2. the AGENTS.md sub-block, managed independently of the super-board block
    block = render_skill_map(steps, mode, named, record, agents, other_note)
    path = root / a.file
    if not path.exists():
        if not a.create:
            die(f"{path} does not exist (pass --create to start one)")
        atomic_write(path, "# AGENTS.md\n\n" + "\n".join(block) + "\n")
        print("created")
        return 0
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    pairs, start = [], None
    for i, l in enumerate(lines):
        if MAP_BEGIN_RE.match(l):
            start = i
        elif MAP_END_RE.match(l) and start is not None:
            pairs.append((start, i))
            start = None
    if len(pairs) > 1:
        die(f"{path} has {len(pairs)} skill-map blocks; leave exactly one and re-run")
    if pairs:
        b, e = pairs[0]
        new = lines[:b] + block + lines[e + 1:]
        verdict = "updated"
    else:
        new = lines + ([""] if lines and lines[-1].strip() else []) + block
        verdict = "inserted"
    new_text = "\n".join(new) + "\n"
    if new_text == text:
        print("unchanged")
        return 0
    atomic_write(path, new_text)
    print(verdict)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("detect", "backup"):
        p = sub.add_parser(name); p.add_argument("--root", default=".")
    p = sub.add_parser("block")
    p.add_argument("--root", default="."); p.add_argument("--file", default="AGENTS.md")
    p.add_argument("--template"); p.add_argument("--version"); p.add_argument("--create", action="store_true")
    p = sub.add_parser("pointer")
    p.add_argument("--root", default="."); p.add_argument("--tail"); p.add_argument("--force", action="store_true")
    p = sub.add_parser("write"); p.add_argument("--src", required=True); p.add_argument("--dest", required=True)
    p = sub.add_parser("units"); p.add_argument("--file", action="append", required=True)
    p = sub.add_parser("coverage")
    p.add_argument("--units", required=True); p.add_argument("--target", action="append", required=True)
    p = sub.add_parser("check"); p.add_argument("--file", required=True)
    p.add_argument("--max-lines", type=int, default=200)
    p = sub.add_parser("skill-map")
    p.add_argument("--root", default="."); p.add_argument("--file", default="AGENTS.md")
    p.add_argument("--named"); p.add_argument("--steps")
    p.add_argument("--agents"); p.add_argument("--other-note"); p.add_argument("--create", action="store_true")
    a = ap.parse_args()
    return globals()[f"cmd_{a.cmd.replace('-', '_')}"](a)


if __name__ == "__main__":
    sys.exit(main())
