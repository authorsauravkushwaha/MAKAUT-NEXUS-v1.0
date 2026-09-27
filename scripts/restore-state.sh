#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# MAKAUT NEXUS — wipe recovery in one command.
#
# Arena wipes periodically reset this repo's git refs to the base commit
# while leaving the working files on disk. Run this to:
#   1. recommit the full working tree on top of origin/main
#   2. rebuild the transfer bundle (MAKAUT-NEXUS-library.bundle)
#   3. reinstall node_modules if missing
#   4. verify: typecheck + checks + (optionally) build
#
# Usage:  bash scripts/restore-state.sh
# Safe to run repeatedly. No network access required.
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."

MSG="Add free student library: chapter-wise notes + DPPs, free books, and timed mock tests"

echo "HEAD before: $(git log --oneline -1)"

# 1 — Recommit if the tree is dirty (post-wipe) or HEAD is still the base.
if git status --porcelain | grep -q .; then
  git reset --soft origin/main
  git add -A
  git -c user.name="Saurav Kushwaha" \
      -c user.email="authorsauravkushwaha@users.noreply.github.com" \
      commit -q -m "$MSG"
  echo "recommitted: $(git log --oneline -1)"
else
  echo "tree clean — commit already in place"
fi

# 2 — Rebuild the delta transfer bundle (prerequisite: origin/main).
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo arena/01a0d566-makaut-nexus-v1-0)"
  git bundle create MAKAUT-NEXUS-library.bundle "$BRANCH" ^origin/main 2>/dev/null
  echo "bundle: $(git bundle list-heads MAKAUT-NEXUS-library.bundle | head -1)"
  git bundle verify MAKAUT-NEXUS-library.bundle 2>&1 | head -1
else
  echo "HEAD == origin/main — nothing to bundle"
fi

# 2b — Rebuild the full transfer zip (every tracked file) + manifest.
rm -f MAKAUT-NEXUS-current-files.zip
git ls-files -z | xargs -0 zip -q MAKAUT-NEXUS-current-files.zip
git ls-files > /home/user/MAKAUT-NEXUS-file-manifest.txt
mkdir -p public && cp -f MAKAUT-NEXUS-current-files.zip public/
echo "zip: $(unzip -l MAKAUT-NEXUS-current-files.zip | tail -1 | awk '{print $2" files, "$1" bytes"}')"

# 2c — Rebuild the dumb-HTTP git serve repo (single complete chain: initial commit → full tree).
#      Served for cloning via the preview URL when the session's GitHub access is closed.
SERVE=/home/user/gitserve
rm -rf "$SERVE"
mkdir -p "$SERVE/repo.git"
git init --bare -q -b transfer "$SERVE/repo.git"
cp -r "$(git rev-parse --git-dir)/objects/." "$SERVE/repo.git/objects/"
TREE="$(git rev-parse 'HEAD^{tree}')"
NEW=$(GIT_AUTHOR_NAME="Saurav Kushwaha" GIT_AUTHOR_EMAIL="authorsauravkushwaha@users.noreply.github.com" \
      GIT_COMMITTER_NAME="Saurav Kushwaha" GIT_COMMITTER_EMAIL="authorsauravkushwaha@users.noreply.github.com" \
      git --git-dir="$SERVE/repo.git" commit-tree "$TREE" -p 57fe75d \
      -m "MAKAUT NEXUS v1.0 — full current source: 3D core + free student library (notes, DPP, books, mock tests)")
git --git-dir="$SERVE/repo.git" update-ref refs/heads/transfer "$NEW"
git --git-dir="$SERVE/repo.git" update-server-info
cp MAKAUT-NEXUS-current-files.zip "$SERVE/"
echo "serve-repo: $(git --git-dir="$SERVE/repo.git" log --oneline -1 transfer)"

# 3 — Dependencies.
if [ ! -d node_modules ]; then
  echo "installing dependencies…"
  npm ci --no-audit --no-fund
fi

# 4 — Verify.
./node_modules/.bin/tsc --noEmit && echo "TSC_OK"
node scripts/run-check.mjs >/dev/null && echo "CHECK_OK"
echo "restore complete."
