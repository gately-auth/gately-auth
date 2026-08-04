#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Run this once to push gately-auth to https://github.com/gately-auth/gately-auth
# Prerequisites: gh CLI installed and authenticated (gh auth login)
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "🔐 Initialising gately-auth repository..."

# 1. Init git
git init
git add .
git commit -m "chore: initial commit — gately-auth v0.1.0"

# 2. Create the repo in the gately-auth org
#    (requires you to be an owner of the org)
gh repo create gately-auth/gately-auth \
  --public \
  --description "Cloudflare-native authentication framework — D1, KV, Workers" \
  --homepage "https://gately-auth.dev" \
  --source=. \
  --push

echo "✅ Done! https://github.com/gately-auth/gately-auth"
