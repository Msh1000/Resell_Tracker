# ResellTrack Mobile 📱🇿🇦

A tactile, offline-first mobile web application and PWA designed for South African auction flipping and Bob Shop reselling. 

Built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **IndexedDB** (`idb`). It runs completely client-side without any backend server, making it 100% compatible with **GitHub Pages**.

---

## ✨ Features

- **📱 Fully Mobile-Optimized:** Designed with an authentic, high-density dark UI (Robinhood/Linear feel), safe-area insets, ergonomic thumb-zone bottom navigation, and native-feeling slide-up bottom sheets.
- **⚡ Live Auction Bids Tracker:** Rapid +/- price steppers (`-R50`, `-R10`, `+R10`, `+R50`, `+R100`) directly on active cards. One-tap "Won" moves the item directly into Inventory with all landed cost calculations intact.
- **🧮 Fast Bob Shop & VAT Calculator:** Handles South African Rand (`R`), 12% buyer fee, 15% VAT modes (Standard, Commission Only, Exempt), 6.6% platform fees, and R30 delivery deductions. Includes solvers for break-even price and 25% target margin price.
- **📦 Inventory Management:** Filter by `IN_STOCK`, `LISTED`, `SOLD`, `RETURNED`. Includes a 1-tap "Mark Sold" flow to log real sale prices and net profit instantly.
- **📊 Executive Dashboard:** Tracks Realized Net Profit, Capital in Stock, Potential Listed Profit, Average Margin %, and Auction Win Rate %.
- **💾 Local Storage & Offline PWA:** Uses browser **IndexedDB** for fast, persistent, local-first storage.
- **🔄 JSON Restore & Backup:** 
  - Restores your exact JSON backup file with 1 click.
  - Automatically pre-seeds with your 11 items and 7 bids on first launch.
  - Export full JSON backup or CSV spreadsheet at any time.

---

## 🚀 Running Locally

1. Open a terminal in `resell-track-mobile`:
   ```bash
   npm run dev -- --host
   ```
   *(Or simply double-click `start.bat`)*

2. Open the URL shown in the terminal (e.g. `http://localhost:5173` or your Wi-Fi IP `http://192.168.x.x:5173` on your phone).

---

## 🌐 Deploying to GitHub Pages

### Option 1: Automatic via GitHub Actions (Recommended)
This repository includes `.github/workflows/deploy.yml`. When you push this code to your GitHub repository:
1. In your GitHub repo, go to **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Every push to `main` or `master` will automatically build and publish to `https://<username>.github.io/<repo-name>/`.

### Option 2: Build Manually
```bash
npm run build
```
The output files in `dist/` are pure static assets that can be hosted on GitHub Pages, Cloudflare Pages, Netlify, or any static host.

---

## 📲 Install as Standalone App on Mobile (PWA)

- **iPhone / iPad (Safari):** Open the site URL, tap the **Share** button, then tap **Add to Home Screen**.
- **Android (Chrome):** Open the site URL, tap the **Three Dots (Menu)**, then tap **Install App** or **Add to Home screen**.
