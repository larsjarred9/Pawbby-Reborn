# 🚀 Upgrading Pawbby Reborn

Pawbby Reborn is constantly evolving. Below you will find the important architectural changes and upgrade instructions for each version.

---

## Upgrading to Alpha 0.2.1 from 0.2.0

Version `0.2.1` introduces full Docker support and officially changes the default networking port of the application.

### 1. Important Port Change

To avoid conflicts with popular self-hosted applications like Grafana, Home Assistant, or other Node.js apps, Pawbby Reborn no longer uses port `3000`.

**The application now officially runs on port `3333`.**

When you click the "Update" button to upgrade to `0.2.1`, the script will automatically restart your server on the new port. Because of this, the dashboard will immediately appear to stop loading.

**After upgrading:**

1. Update your browser bookmarks.
2. Navigate to `http://localhost:3333` (or your server's IP address on port 3333) to access your newly upgraded dashboard!

### 2. Docker Support

This version brings official Docker support! If you prefer containerized deployments, you can now abandon the manual PM2 setup entirely.

To migrate from PM2 to Docker and keep your data:

1. Stop your existing PM2 process so it doesn't conflict: `pm2 delete pawbby && pm2 save`
2. Ensure your server has Docker and Docker Compose installed.
3. Navigate to your Pawbby Reborn folder.
4. Create a data directory: `mkdir data`
5. Copy your existing database into it: `cp web/dev.db data/pawbby.db` (If you didn't use a custom path, it might be at `cp web/prisma/dev.db data/pawbby.db`).
6. Run `docker-compose up -d --build`.
7. Your old data is now safely running inside Docker!

---

## Upgrading from Alpha 0.1.x to Alpha 0.2.0

Alpha 0.2.0 introduces several **massive** architectural and security improvements to Pawbby Reborn. Because of these fundamental changes, there are a few things you need to know when upgrading from an older `0.1.x` version.

### 1. Upgrading from the Terminal

In version `0.1.x`, clicking the "Update" button merely told you to manually run the `./upgrade.sh` script in your terminal. However, because `0.2.0` fundamentally restructures the PM2 architecture and the `upgrade.sh` script itself, running the old script might cause unpredictable behavior when `git pull` overwrites the file mid-execution.

To ensure a perfectly clean upgrade to the new `0.2.0` architecture, please bypass the script this one time and run the following commands manually in the root of your repository:

```bash
# 1. Pull the latest code
git pull origin main

# 2. Re-install dependencies (we restructured the package.json)
cd web
npm install

# 3. Rebuild the production Nuxt server
npm run build

# 4. Restart PM2 and FORCE it to read the new ecosystem.config.cjs
cd ..
pm2 start ecosystem.config.cjs --env production --update-env
pm2 save
```

### 2. New `.env` Features

Alpha 0.2.0 introduces a brand new **Strict Webhook Security Mode** to prevent Server-Side Request Forgery (SSRF) attacks.

By default, the update will run in **Relaxed Mode**, which allows local LAN IP addresses so that your local Home Assistant and ntfy.sh webhooks continue to function flawlessly.

However, if you want to lock your server down entirely, you can manually add the following line to your `web/.env` file:

```env
# Strict Webhook Security
# If "true", the server will ONLY allow webhooks to known, secure domains
# (Discord, Slack, Telegram). If "false" or missing, it allows local network IP addresses
# (e.g. for Home Assistant or a local ntfy.sh instance).
WEBHOOK_STRICT_MODE="true"
```

After modifying your `web/.env` file, simply restart your PM2 process: `pm2 restart pawbby`

---

_Thank you for testing Pawbby Reborn! If you encounter any bugs after upgrading, please open an issue on GitHub._
