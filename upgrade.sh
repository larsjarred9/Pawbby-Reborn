#!/bin/bash
echo "==========================================="
echo "🐾 Upgrading Pawbby Reborn to latest version"
echo "==========================================="
echo ""

# Exit immediately if a command exits with a non-zero status
set -e

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
git reset --hard HEAD # Discard any accidental local changes that would block the pull
git pull origin main

# 2. Navigate to web app
cd web || { echo "❌ Failed to enter 'web' directory"; exit 1; }

# 3. Clear Vite/Nuxt cache to prevent manifest errors
echo "🧹 Clearing Nuxt cache..."
npx nuxi clean

# 4. Install new dependencies if any
echo "📦 Installing any new dependencies..."
npm install

# 4. Sync database schema (safe)
echo "🗄️ Syncing local database schema..."
npx prisma db push

# 5. Build for production (optional, but good practice if they are running build)
echo "🔨 Building for production..."
npm run build

echo ""
echo "==========================================="
echo "✅ Upgrade complete! Your dashboard is fully up to date."
echo "🚀 Attempting to restart PM2 service..."
if command -v pm2 &> /dev/null
then
    # Use 'start <config> --update-env' instead of 'restart' to ensure any changes
    # to the ecosystem.config.cjs (like the new Alpha 0.2.0 fork mode) are actually applied.
    pm2 start ../ecosystem.config.cjs --env production --update-env || echo "PM2 service 'pawbby' failed to start/restart."
    pm2 save
else
    echo "PM2 not found. Please manually restart your node process to apply changes."
    echo "   (e.g., restart your 'npm run dev' terminal window)"
fi
echo "==========================================="
