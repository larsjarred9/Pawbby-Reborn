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

Our immediate focus is exposing the local Tuya LAN protocol (v3.4), mapping out data points (DPs), sniffing background payloads, and sharing all technical findings transparently. We are building a global, open knowledge base so anyone can interact with their hardware using raw code.

- 👉 _To view our complete technical findings, byte structures, and DP schemas, check out [values.md](values.md)._

### Phase 2: The Local Web Interface

Once the core functionality is fully mapped, our goal is to build a beautiful, lightweight, self-hosted web app. This local interface will mimic the features and feel of the original mobile app layout, allowing you to monitor your cat's usage data, track weight variations, and trigger cleaning cycles entirely within your own home network—no external cloud required.

---

## ⚖️ Why We Chose the AGPL-3.0 License

We chose the **GNU Affero General Public License v3.0** with a very specific goal in mind: **to ensure this hardware can never be broken, abandoned, or locked away by a company again.**

By using a strong copyleft license, we guarantee that the code we build together stays in the hands of the community forever. Anyone is free to use and modify this project for their home, but any network service, fork, or smart-home integration built using our engine _must_ also make its source code completely public under the same terms. This permanently blocks corporate entities from hijacking our hard work, wrapping it in a private layer, or turning it into a closed-source subscription service.

---

## 🤝 Join the Effort & Collaborate

This is a collaborative community rescue mission. Whether you are an experienced packet-sniffer, a frontend developer ready to tackle the UI, or just a frustrated Pawbby owner who wants to help test commands, we need your help.

- 💬 **Communication & Development:** [Join our Discord Server](https://discord.gg/Tw43AKZkge) to talk strategy, share logs, and coordinate the software build in real-time.
- 📂 **Technical Specifications:** Read through `values.md` for our updated matrix of local network commands and authentication extraction strategies.

Let's unbrick some hardware. 🐈‍⬛⚡
