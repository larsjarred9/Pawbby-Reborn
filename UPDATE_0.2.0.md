# 🚀 Upgrading from Alpha 0.1.x to 0.2.0

Alpha 0.2.0 introduces several **massive** architectural and security improvements to Pawbby Reborn. Because of these fundamental changes, there are a few things you need to know when upgrading from an older `0.1.x` version.

## 1. Upgrading from the Terminal

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

## 3. New `.env` Features

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

*Thank you for testing Pawbby Reborn! If you encounter any bugs after upgrading, please open an issue on GitHub.*
