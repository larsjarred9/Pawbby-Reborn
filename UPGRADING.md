# 🚀 Upgrading Pawbby Reborn

Pawbby Reborn version `0.4.0` introduces **Authentication and Local Admin Accounts** to secure your dashboard. Because of these fundamental changes, there are a few things you need to know depending on which version you are upgrading from.

## 1. Upgrading from v0.3.0 to v0.4.0

Version `0.4.0` can be upgraded seamlessly via the 1-Click Update button on your dashboard. 

**Important Post-Update Action:**
Because `0.4.0` introduces strict local security, existing users who upgrade from `0.3.0` will automatically be redirected to a **Set Password** wizard the first time they visit the dashboard after upgrading. You must create a local admin password to secure your instance before you can continue accessing your Pawbby data.

## 2. Upgrading from v0.2.x to v0.3.0 (1-Click Update)

Starting in version `0.2.x`, Pawbby Reborn features a built-in 1-Click Upgrade system! 

When a new update is pushed to GitHub, you will see a green **Update Available** banner on your dashboard. Simply click it, and the dashboard will automatically download, build, and restart the new version for you.

*Note: If you run Pawbby Reborn in a highly restrictive environment (like Docker or an unprivileged user), you can completely disable the 1-Click upgrade by adding `DISABLE_UPDATES="true"` to your `web/.env` file or `docker-compose.yml`. You will still see the update notification banner on the dashboard, but the UI will prompt you to rebuild your container or run `./upgrade.sh` manually instead of executing the upgrade itself.*

---

## Upgrading to v0.2.1

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
5. Copy your existing database into it: `cp web/dev.db data/pawbby.db` (If you set a custom `DATABASE_URL`, copy that SQLite file instead).
6. Run `docker-compose up -d --build`.
7. Your old data is now safely running inside Docker!

---

## Upgrading from Alpha 0.1.x to 0.3.0 (Manual)

In version `0.1.x`, clicking the "Update" button merely told you to manually run the `./upgrade.sh` script in your terminal. Because `0.3.0` fundamentally restructures the PM2 architecture and the `upgrade.sh` script itself, running the old script might cause unpredictable behavior when `git pull` overwrites the file mid-execution.

To ensure a perfectly clean upgrade to the new `0.3.0` architecture, please bypass the script this one time and run the following commands manually in the root of your repository:

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

### New `.env` Security Features

Version `0.2.0` (and `0.3.0`) introduces a brand new **Strict Webhook Security Mode** to prevent Server-Side Request Forgery (SSRF) attacks.

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
