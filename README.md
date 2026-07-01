# Pawbby Reborn 🐾

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289DA.svg)](https://discord.gg/Tw43AKZkge)

> **"Bringing the Pawbby Smart Litter Box back from the dead after the cloud went dark."**

`Pawbby Reborn` is a community-led effort to rescue the **Pawbby Smart Cat Litter Box** from becoming completely useless e-waste. In early 2026, Pawbby's cloud infrastructure went dark permanently, leaving owners worldwide with bricked, unresponsive hardware.

This project exists to bypass the dead servers entirely, giving these machines a second nine lives through local network control.

---

## 🎯 Our Two-Step Roadmap

We are tackling this rescue mission in two distinct phases:

### Phase 1: Deep Reverse Engineering & Public Documentation

Our immediate focus was exposing the local Tuya LAN protocol (v3.4), mapping out data points (DPs), sniffing background payloads, and sharing all technical findings transparently.

- 👉 _To view our complete technical findings, byte structures, and DP schemas, check out [values.md](values.md)._

### Phase 2: The Local Web Interface (Alpha)

We have built a beautiful, lightweight, self-hosted web app. This local interface mimics the features and feel of the original mobile app layout, allowing you to monitor your cat's usage data, track weight variations, and trigger cleaning cycles entirely within your own home network—no external cloud required.

---

## ⚠️ Experimental & Unfinished Features

While the dashboard successfully tracks weight, durations, litter levels, and waste bin capacity, some hardware triggers are still highly experimental:

- **Remote Cleaning Cycle:** We have successfully reverse-engineered the `Flatten` (litter leveling) and `Empty` (dump all litter) commands via DP 106. However, the exact data packet to trigger a standard "Auto Clean" or "Manual Clean" drum rotation remotely is **still unknown**. If you click "Clean" in the app, it is currently disabled.
- **Litter Sensor:** The hardware does not explicitly broadcast an "Insufficient Litter" status (as far as we know, more research is needed). Instead, the dashboard makes an experimental guess by reading the raw weight sensor (DP 112). If the raw weight of the litter inside the drum drops below ~1500g, we flag it as "Insufficient". However, the scale drifts over time and can sometimes read artificially low.
- **Waste Bin Status:** The machine's internal laser sensor cannot distinguish between the bin being physically removed and the bin being installed but completely empty. Pulling the bin out will sometimes clear the "Bin Full" error in the dashboard.

---

## 🖥️ Recommended Hardware (Microcomputers)

Because the Pawbby Smart Litter Box requires a persistent local connection to intercept events (like your cat visiting), **you must run this software on a device that stays powered on 24/7 on your home network.**

We highly recommend using a low-power microcomputer, such as:

- **Raspberry Pi** (Pi 3, 4, or 5)
- **Mini PCs** (Intel N100 machines, Beelink, Minisforum)
- An always-on home NAS (Synology, Unraid) via Docker

### Remote Access (Outside Your Home)

Because this app relies entirely on your local Wi-Fi to talk to the litter box (bypassing the dead Pawbby cloud servers), you will not be able to access the dashboard when you leave your house unless you set up a VPN. We recommend installing **Tailscale** or **WireGuard** on your microcomputer to securely tunnel into your home network from your phone.

---

## 🔑 Tuya Local Credentials

To allow the dashboard to communicate with your Pawbby box, you must extract its local **Tuya Device ID** and **Local Key**. Because the official Pawbby cloud is dead, you cannot pull these from the official app.

If your device was previously connected to your Wi-Fi before the servers died, you will need to use a packet sniffing tool (like Wireshark) or a rooted Android emulator with a Tuya extraction script to intercept the `localkey` broadcast on your local network. Please refer to our Discord community for the latest scripts and methods for extracting these keys from orphaned Tuya devices.

Once you have your `Device ID` and `Local Key`, you can input them directly into the "Settings" page of the Pawbby Reborn dashboard.

---

## 🛠️ Setup & Installation

To run the Pawbby Reborn dashboard on your local network, you will need a machine capable of running Node.js.

There are three primary ways to run the dashboard:

- **Development Deployment**: Perfect for testing, tinkering, or quickly viewing the dashboard. This runs directly in your terminal, meaning it shuts down as soon as you close your window.
- **Production Deployment (Docker)**: The cleanest, most modern way to run Pawbby Reborn. It keeps all dependencies containerized and isolated. Recommended for Synology NAS, Unraid, or modern Linux servers.
- **Production Deployment (PM2)**: A lightweight alternative if you want to run the app directly on your host OS (like a Raspberry Pi) without installing Docker.

### Prerequisites

- Node.js (v18+)
- npm (Node Package Manager)

### Development Deployment

1. Clone this repository to your local machine.
2. Navigate to the `web` directory:
   ```bash
   cd web
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```
4. Run the interactive setup wizard (this will automatically configure your database and environment settings):
   ```bash
   npm run setup
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open a web browser and navigate to `http://localhost:3000` to access the dashboard.

_(For production deployment, run `npm run build` and follow standard Nuxt 4 deployment guidelines.)_

### 🐳 Background Deployment (Docker)

Docker is the cleanest way to run Pawbby Reborn. It packages everything into an isolated container and handles database persistence automatically.

1. Clone this repository to your machine.
2. Ensure you have Docker and Docker Compose installed.
3. Simply run the following command in the root folder:
   ```bash
   docker-compose up -d --build
   ```
4. Open a web browser and navigate to `http://localhost:3333` to access the dashboard.

*To change environment settings like webhooks or update the port, just edit the `docker-compose.yml` file and run the command again.*

### 🚀 Background Deployment (PM2)

If you only use `npm run dev`, the dashboard will immediately shut down the second you close your terminal or disconnect your SSH session. Because Pawbby Reborn needs to constantly listen to your local network to intercept litter box events (like tracking when your cat visits), **it must run 24/7 in the background**.

The easiest way to turn Pawbby Reborn into a persistent background "daemon" (especially on a Raspberry Pi) is by using **PM2**, a lightweight process manager for Node.js.

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```
2. Build the production application:
   ```bash
   cd web
   npm run build
   cd ..
   ```
3. Start the application in the background. This will instantly detach it from your terminal, allowing you to close the window safely:
   ```bash
   pm2 start ecosystem.config.cjs
   ```
4. Tell PM2 to automatically start Pawbby Reborn whenever your device reboots:
   ```bash
   pm2 startup
   pm2 save
   ```

_Note: You never need to touch PM2 again to update! When you hit "Confirm & Update" in the dashboard UI, the auto-updater will seamlessly restart the background service for you._

---

## 🔄 Updating to the Latest Version

We are actively discovering new payloads and improving the dashboard. As of **version 0.2.0**, you can update Pawbby Reborn directly from within the dashboard!

1. Open your **Settings** tab in the dashboard.
2. Click **Check for Updates**.
3. If an update is available, click **Confirm & Update**. The app will automatically pull the newest code, install dependencies, sync the database, and restart your PM2 service without you ever touching a terminal!

_(Alternatively, you can still update PM2 manually by running `./upgrade.sh` from the root folder in your terminal)._

### 🐳 Updating in Docker

Because Docker containers are isolated, the 1-Click Update button cannot restart your container. When you see the green "Update Available" notification on your dashboard, simply rebuild your container:

```bash
git pull origin main
docker-compose up -d --build
```

---

## 🤝 Join the Effort & Collaborate

This is a collaborative community rescue mission. Whether you are an experienced packet-sniffer, a frontend developer ready to tackle the UI, or just a frustrated Pawbby owner who wants to help test commands, we need your help.

- 💬 **Communication & Development:** [Join our Discord Server](https://discord.gg/Tw43AKZkge) to talk strategy, share logs, and coordinate the software build in real-time.
- 📂 **Technical Specifications:** Read through `values.md` for our updated matrix of local network commands and authentication extraction strategies.

### 📤 Sharing Your Database for Development

Because the dashboard saves the raw Tuya JSON payloads from your litter box directly into the database, sharing your database with the developers is incredibly helpful for finding missing commands (like the remote auto-clean trigger).

To share your logs safely without exposing your Wi-Fi device keys:

1. Navigate to the `web` directory in your terminal.
2. Run the anonymization script:
   ```bash
   npm run anonymize
   ```
3. This will create a completely safe, redacted copy of your database at `web/prisma/share.db`.
4. You can now safely drag and drop `share.db` into the Discord server!

---

## ⚖️ Why We Chose the AGPL-3.0 License

We chose the **GNU Affero General Public License v3.0** with a very specific goal in mind: **to ensure this hardware never falls victim to corporate abandonment and remains community-controlled forever.**

By using this license, we guarantee that the code we build together stays in the hands of the community forever. Anyone is free to use and modify this project for their home, but any network service, fork, or smart-home integration built using our engine must also make its source code completely public under the same terms. This permanently blocks corporate entities from hijacking our hard work, wrapping it in a private layer, or turning it into a closed-source subscription service.

Let's unbrick some hardware. 🐈‍⬛⚡
