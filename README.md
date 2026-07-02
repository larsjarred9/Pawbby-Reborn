# Pawbby Reborn 🐾

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289DA.svg)](https://discord.gg/Tw43AKZkge)

> **"A beautiful, fully local, cloud-free dashboard for your Pawbby Smart Litter Box."**

`Pawbby Reborn` rescues your Pawbby Smart Cat Litter Box from the dead cloud servers, giving it a second life through 100% local, lightning-fast network control.

Say goodbye to slow app loading times, server outages, and data privacy concerns. Pawbby Reborn runs entirely inside your own home network!

---

## ✨ Features

- **100% Local & Private:** Your cat's data never leaves your house. The dashboard talks directly to the litter box over your local Wi-Fi, completely bypassing the Tuya/Pawbby cloud.
- **Beautiful Dashboard:** Monitor your litter box's status, waste bin capacity, and litter levels in real-time through a stunning, mobile-friendly web app.
- **Multi-Cat Tracking:** Automatically identifies which cat used the box based on their weight and tracks their bathroom habits and weight trends over time.
- **Push Notifications:** Easily integrate with Home Assistant, Discord, Slack, or Ntfy to receive instant alerts when a cat uses the box or when the waste bin is full.
- **Built-In Setup Wizard:** No more scary packet sniffing! Pawbby Reborn features a beautifully illustrated, step-by-step setup wizard that guides you through connecting your device securely in under 5 minutes.
- **1-Click Updates:** When new features drop, simply click the "Update Available" banner in the UI to seamlessly download and apply updates without ever touching a terminal.

---

## 🛠️ Setup & Installation

To run Pawbby Reborn, you will need a device that stays powered on 24/7 on your home network. A **Raspberry Pi**, an old laptop, or a home server (like a Synology NAS or Unraid) is perfect!

There are three primary ways to run the dashboard. Choose the one that best fits your environment:

| Method                | Guide                                                                                             | Use Case                                                    | Pros                                                                                              | Cons                                                                                     |
| :-------------------- | :------------------------------------------------------------------------------------------------ | :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------- |
| **PM2** (Recommended) | [📖 Read Guide](<https://github.com/larsjarred9/Pawbby-Reborn/wiki/PM2-Deployment-(Recommended)>) | Best for most users, Raspberry Pi, or direct Linux installs | ⚡ Very lightweight<br>✨ Full support for 1-Click Updates<br>🔄 Restarts automatically on reboot | ℹ️ Requires installing PM2 globally                                                      |
| **Docker**            | [📖 Read Guide](<https://github.com/larsjarred9/Pawbby-Reborn/wiki/Docker-Deployment-(Advanced)>) | Best for advanced users with Synology or Unraid servers     | 🐳 Cleanest installation<br>📦 Keeps dependencies isolated<br>🔄 Restarts automatically on reboot | ❌ 1-Click Update feature disabled (requires manual `docker compose up --build` instead) |
| **NPM (Dev)**         | [📖 Read Guide](<https://github.com/larsjarred9/Pawbby-Reborn/wiki/NPM-Setup-(Development)>)      | Best for testing and development                            | 🛠️ Hot Module Replacement (HMR)<br>🚀 Instant feedback when coding                                | 🛑 Shuts down when terminal closes<br>🛑 Not suitable for 24/7 background usage          |

---

## 🔄 Updating to the Latest Version

We are actively discovering new payloads and improving the dashboard. As of **version 0.3.0**, you can update Pawbby Reborn directly from within the dashboard!

1. If an update is available, a green banner will appear on your dashboard.
2. Click **Review & Update**.
3. Click **Confirm & Update**. The app will automatically pull the newest code, install dependencies, sync the database, and restart your PM2 service without you ever touching a terminal!

_⚠️ **Note for Early Adopters:** If you are currently running version `0.1.x`, you cannot use the auto-updater. Please read the [UPGRADING.md](UPGRADING.md) guide for manual instructions to transition your installation to the new `0.3.0` architecture._

_(Alternatively, you can still update PM2 manually by running `./upgrade.sh` from the root folder in your terminal)._

---

## 📤 Sharing Your Database for Development

Because the dashboard saves the raw Tuya JSON payloads from your litter box directly into the database, sharing your database with the developers is incredibly helpful for finding missing commands (like the remote auto-clean trigger).

To share your logs safely without exposing your Wi-Fi device keys:

1. Open the **Settings** tab in your Pawbby Reborn dashboard.
2. Click **Export Anonymized DB**.
3. A safe, heavily redacted file named `pawbby-share.db` will immediately download to your computer.
4. You can safely drag and drop this file into the Discord server! (All IP addresses, Wi-Fi keys, Tuya tokens, and personal names have been permanently erased).

---

## 🤝 Join the Effort & Collaborate

This is a collaborative community rescue mission. Whether you are an experienced packet-sniffer, a frontend developer ready to tackle the UI, or just a frustrated Pawbby owner who wants to help test commands, we need your help.

- 💬 **Communication & Development:** [Join our Discord Server](https://discord.gg/Tw43AKZkge) to talk strategy, share logs, and coordinate the software build in real-time.
- 📂 **Technical Specifications:** Read through `values.md` for our updated matrix of local network commands and authentication extraction strategies.

---

## ⚖️ Why We Chose the AGPL-3.0 License

We chose the **GNU Affero General Public License v3.0** with a very specific goal in mind: **to ensure this hardware never falls victim to corporate abandonment and remains community-controlled forever.**

By using this license, we guarantee that the code we build together stays in the hands of the community forever. Anyone is free to use and modify this project for their home, but any network service, fork, or smart-home integration built using our engine must also make its source code completely public under the same terms. This permanently blocks corporate entities from hijacking our hard work, wrapping it in a private layer, or turning it into a closed-source subscription service.

Let's unbrick some hardware. 🐈‍⬛⚡
