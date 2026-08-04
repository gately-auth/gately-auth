# ─────────────────────────────────────────────────────────────────────────────
# PowerShell version — run this to push gately-auth to the gately-auth GitHub org
# Prerequisites: gh CLI installed → https://cli.github.com
#                Run: gh auth login   (authenticate first)
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "🔐 Initialising gately-auth repository..." -ForegroundColor Cyan

# 1. Init git (run from the gately-auth folder)
git init
git add .
git commit -m "chore: initial commit — gately-auth v0.1.0"

# 2. Create the repo in the gately-auth GitHub org
gh repo create gately-auth/gately-auth `
  --public `
  --description "Cloudflare-native authentication framework — D1, KV, Workers" `
  --homepage "https://gately-auth.dev" `
  --source=. `
  --push

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green
Write-Host "   https://github.com/gately-auth/gately-auth" -ForegroundColor Cyan
