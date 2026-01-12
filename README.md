# Sentinela (Chrome Extension)

A powerful Chrome extension for scraping and analyzing social media profiles (Instagram & TikTok), built with React, TypeScript, and Vite.

## Features

- **Profile Scraping**: Extract profile info from Instagram and TikTok.
- **Post Analysis**: Scrape latest posts with detailed stats (likes, comments, views).
- **Data Export**: Export scraped data to JSON or CSV.
- **Modern UI**: Clean, responsive sidepanel interface using Shadcn UI.
- **React + TypeScript**: Built with modern web technologies.

## 📦 Cara Install Extension

Ikuti langkah-langkah berikut untuk menginstall Sentinela di browser Chrome/Edge.

### 1. Build Project
Sebelum menginstall, Anda perlu menyiapkan folder ekstensi (folder `dist`) dengan cara menjalankan perintah berikut di terminal:
```bash
npm install
npm run build
```

### 2. Buka Extensions Page
Buka browser Chrome/Edge, ketik URL berikut di address bar, lalu tekan Enter.
- Chrome: `chrome://extensions/`
- Edge: `edge://extensions/`

### 3. Aktifkan Developer Mode
Aktifkan toggle **"Developer mode"** yang ada di pojok kanan atas halaman extensions.

### 4. Load Unpacked
Klik tombol **"Load unpacked"** di pojok kiri atas, lalu cari dan pilih folder `dist` yang ada di dalam direktori project ini.

### 5. Extension Siap Digunakan!
Extension berhasil terinstall! Buka website **TikTok** atau **Instagram**, lalu buka Sidepanel Chrome untuk mulai menggunakan.

> **Tips:** Setelah install, pin extension di toolbar browser agar mudah diakses. Klik icon puzzle 🧩 di toolbar, lalu klik pin pada **Sentinela**.

## Project Structure

- `src/sidepanel/` - Main extension UI (Sidepanel)
- `src/options/` - Full-page options and data view
- `src/content/` - Scripts injected into web pages (Instagram/TikTok scrapers)
- `src/background/` - Background service worker
- `src/services/` - Core logic for API fetching and data processing
- `manifest.config.ts` - Manifest V3 configuration

## Tech Stack

- React 18
- TypeScript
- Vite
- CRXJS Vite Plugin
- Tailwind CSS
- Shadcn UI
- Lucide React Icons
