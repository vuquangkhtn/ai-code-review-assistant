#!/usr/bin/env bash
# simulate-release-detection.sh — issue-39 QA v1
#
# Replays the EXACT tag-diff release-detection snippet from
# .github/workflows/complete-pipeline.yml "Create release with semantic-release"
# (lines 231-250 at head b8fc7ed) against a synthetic bare-remote git repo.
# `npx semantic-release` is simulated by pushing tags from a second clone
# (the same effect semantic-release's @semantic-release/git + github plugins have).
# Every case gets its own remote/pusher so cases cannot leak tags into each other.
#
# Run: bash simulate-release-detection.sh
# Exit 0 = all expected outcomes hold; nonzero = a case regressed.
set -uo pipefail

SIMROOT=$(mktemp -d "${TMPDIR:-/tmp}/issue39-relsim.XXXXXX")
trap 'rm -rf "$SIMROOT"' EXIT
PASS=0; FAIL=0
BAR='────────────────────────────────────────────────────────'

note() { printf '%s\n' "$*"; }

# case_setup <name> <seed-tag> — one isolated bare remote + pusher + runner
case_setup() {
  CASE_NAME="$1"
  SEED="$2"
  REMOTE="$SIMROOT/$CASE_NAME/remote.git"
  mkdir -p "$SIMROOT/$CASE_NAME"
  git init -q --bare "$REMOTE"
  PUSHER="$SIMROOT/$CASE_NAME/pusher"
  git clone -q "$REMOTE" "$PUSHER" 2>/dev/null
  git -C "$PUSHER" config user.email pusher@sim.local
  git -C "$PUSHER" config user.name pusher-sim
  git -C "$PUSHER" commit -q --allow-empty -m "initial"
  git -C "$PUSHER" push -q origin HEAD
  RUNNER="$SIMROOT/$CASE_NAME/runner"
  git clone -q "$REMOTE" "$RUNNER" 2>/dev/null
  git -C "$RUNNER" config user.email qa@sim.local
  git -C "$RUNNER" config user.name qa-sim
  git -C "$RUNNER" commit -q --allow-empty -m "seed commit"
  git -C "$RUNNER" push -q origin HEAD
  if [ -n "$SEED" ]; then
    git -C "$PUSHER" tag "$SEED"
    git -C "$PUSHER" push -q origin "$SEED"
    git -C "$RUNNER" fetch -q --tags --force
  fi
  GITHUB_OUTPUT_FILE="$SIMROOT/$CASE_NAME/gh_output"
  STDOUT_FILE="$SIMROOT/$CASE_NAME/stdout"
  : > "$GITHUB_OUTPUT_FILE"; : > "$STDOUT_FILE"
}

# remote_tag <tag> — simulate semantic-release (or a concurrent actor) pushing a tag
remote_tag() {
  git -C "$PUSHER" tag -f "$1" >/dev/null
  git -C "$PUSHER" push -q origin "$1"
}

# run_snippet — the verbatim release-detection logic from the workflow
run_snippet() {
  (
    cd "$RUNNER"
    export GITHUB_OUTPUT="$GITHUB_OUTPUT_FILE"
    BEFORE_TAGS=$(git tag -l 'v*' | sort -u)
    # npx semantic-release   <-- simulated by remote_tag() before this call
    git fetch --tags --force --quiet
    AFTER_TAGS=$(git tag -l 'v*' | sort -u)
    NEW_TAG=$(comm -13 <(printf '%s\n' "$BEFORE_TAGS") <(printf '%s\n' "$AFTER_TAGS") | head -1)

    if [ -n "$NEW_TAG" ]; then
      NEW_VERSION="${NEW_TAG#v}"
      echo "new_version=$NEW_VERSION" >> "$GITHUB_OUTPUT"
      echo "tag_name=$NEW_TAG" >> "$GITHUB_OUTPUT"
      echo "release_created=true" >> "$GITHUB_OUTPUT"

      echo "✅ Released version $NEW_VERSION with tag $NEW_TAG"
    else
      echo "release_created=false" >> "$GITHUB_OUTPUT"
      echo "ℹ️ No release created — semantic-release found no relevant changes (publish stages are skipped)"
    fi
  ) > "$STDOUT_FILE" 2>&1
}

check() {
  local expect_release="$1" expect_version="$2" expect_tag="$3"
  local rel ver tag
  rel=$(grep -o 'release_created=.*' "$GITHUB_OUTPUT_FILE" | cut -d= -f2)
  ver=$(grep -o 'new_version=.*' "$GITHUB_OUTPUT_FILE" | cut -d= -f2)
  tag=$(grep -o 'tag_name=.*' "$GITHUB_OUTPUT_FILE" | cut -d= -f2)
  local ok=true
  [ "$rel" = "$expect_release" ] || ok=false
  if [ -n "$expect_version" ]; then [ "$ver" = "$expect_version" ] || ok=false; fi
  if [ -n "$expect_tag" ]; then [ "$tag" = "$expect_tag" ] || ok=false; fi
  note "$BAR"
  note "case: $CASE_NAME"
  note "  outputs: $(tr '\n' ' ' < "$GITHUB_OUTPUT_FILE")"
  note "  stdout : $(tr '\n' ' ' < "$STDOUT_FILE")"
  if $ok; then note "  RESULT: PASS (release_created=$rel as expected)"; PASS=$((PASS+1));
  else note "  RESULT: FAIL (expected release_created=$expect_release version=$expect_version tag=$expect_tag)"; FAIL=$((FAIL+1)); fi
}

note "issue-39 release-detection simulation — workflow snippet replay"
note "simroot: $SIMROOT"

# ---------- Case 1: semantic-release pushes a new tag (real release, AC3) ----------
case_setup "new-tag-after-v0.10.0" "v0.10.0"
remote_tag "v0.11.0"      # simulated release push
run_snippet
check true "0.11.0" "v0.11.0"

# ---------- Case 2: semantic-release publishes nothing (no-relevant-changes, AC3) ----------
case_setup "no-new-tag" "v0.10.0"
# no remote_tag call — semantic-release found nothing to release
run_snippet
check false "" ""

# ---------- Case 3: first release (no prior v* tags) ----------
case_setup "first-release-empty-before" ""
remote_tag "v1.0.0"
run_snippet
check true "1.0.0" "v1.0.0"

# ---------- Case 4: concurrent actor tag while this run releases nothing (race) ----------
case_setup "race-foreign-tag" "v0.10.0"
remote_tag "v0.12.0"      # foreign actor pushes between BEFORE capture and AFTER fetch
# this run's semantic-release itself publishes nothing
run_snippet
check true "" ""   # documents the MEDIUM race gap; outcome recorded, not a regression gate

# ---------- Case 5: multiple new tags (real + foreign) ----------
case_setup "multiple-new-tags" "v0.10.0"
remote_tag "v0.11.0"      # real release
remote_tag "v0.11.9"      # foreign tag also lands
run_snippet
check true "0.11.0" "v0.11.0"

# ---------- Case 6: non-v foreign tag is ignored by the v* filter ----------
case_setup "non-v-tag-ignored" "v0.10.0"
remote_tag "weekly-snapshot"   # tag not matching 'v*'
run_snippet
check false "" ""

note "$BAR"
note "summary: PASS=$PASS FAIL=$FAIL"
note "case 4 documents a known MEDIUM race limitation (see REPORT.md test-gap ledger) — outcome recorded, not a regression gate."
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
