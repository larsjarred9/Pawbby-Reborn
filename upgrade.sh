#!/bin/bash
echo "==========================================="
echo "🐾 Upgrading Pawbby Reborn to latest version"
echo "==========================================="
echo ""

# Exit immediately if a command exits with a non-zero status
set -e

# Error trap to log failure line
trap 'echo "❌ Upgrade failed on line $LINENO. See upgrade.log for details." >&2' ERR

# Ensure common PM2/Node binary paths are included in PATH
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin:$HOME/.npm-global/bin:$HOME/.nvm/versions/node/$(node -v 2>/dev/null)/bin"

# Optimize memory allocation for resource-constrained systems (e.g. Raspberry Pi)
# Give Node V8 extra space before throwing OOM, while not crashing smaller systems
if [ -z "$NODE_OPTIONS" ]; then
    export NODE_OPTIONS="--max-old-space-size=2048"
    echo "🧠 Set build memory limit: NODE_OPTIONS=\"$NODE_OPTIONS\""
fi

# 0. Backup the database
echo "💾 Backing up the database..."
if [ -f "web/dev.db" ]; then
    BACKUP_NAME="dev.db.bak-$(date +%F_%H-%M-%S)"
    cp web/dev.db "web/$BACKUP_NAME"
    echo "✅ Database backed up to $BACKUP_NAME!"
else
    echo "⚠️ No database found to backup, skipping..."
fi
echo ""

# 1. Pull latest code from GitHub
echo "🔄 Pulling latest changes from GitHub..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️ Local git changes detected. Stashing changes to allow clean pull..."
    git stash
fi
git pull origin main

# 2. Navigate to web app
cd web || { echo "❌ Failed to enter 'web' directory"; exit 1; }

# 3. Clear Vite/Nuxt cache to prevent manifest errors
echo "🧹 Clearing Nuxt cache..."
npx nuxi clean || true

# 4. Install new dependencies if any
echo "📦 Installing any new dependencies..."
npm install --prefer-offline --no-audit

# 5. Sync database schema (safe)
echo "🗄️ Syncing local database schema..."
npx prisma db push

# 6. Build for production with memory optimization
echo "🔨 Building for production..."
npm run build

echo ""
echo "==========================================="
echo "✅ Upgrade complete! Your dashboard is fully up to date."
echo "🚀 Attempting to restart PM2 service..."
if command -v pm2 &> /dev/null
then
    # Use 'start <config> --update-env' instead of 'restart' to ensure any changes
    # to the ecosystem.config.cjs (like fork mode) are actually applied.
    pm2 start ../ecosystem.config.cjs --env production --update-env || pm2 restart pawbby || echo "⚠️ PM2 service 'pawbby' failed to start/restart."
    pm2 save || true
    echo "✅ PM2 service successfully restarted!"
else
    echo "ℹ️ PM2 not found in PATH ($PATH). Please manually restart your node process to apply changes."
    echo "   (e.g., run: pm2 restart pawbby)"
fi
echo "==========================================="
