# DeadEnd 🛡️
**Туристің цифрлық анасы** — Digital safety platform for tourists in Mangystau, Kazakhstan

Built by **Kublitters Team** · Yessenov University · Aktau

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev
# → Open http://localhost:5173/deadend/

# 3. Build for production
npm run build

# 4. Deploy to GitHub Pages
npm run deploy
```

---

## Features

- 🛡️ **Safety tracking** — Start/Stop/SOS with GPS checkpoints
- 👤 **Tourist profile** — Photo, blood type, vehicle, clothing for MChS
- ⚠️ **Smart warnings** — Wind, heat, livestock, no-signal zones per route
- 💬 **Mama says** — Warm local tips for each destination
- 🎵 **Route Vibes Radio** — Music changes automatically by GPS location
- 👥 **Group trips** — All members in one MChS card
- 🔑 **PIN emergency access** — Send SOS from any phone without login
- 📡 **Offline mode** — Works without internet, auto-syncs when signal returns
- 🛡️ **Admin/MChS panel** — Real-time tourist monitoring with SOS alerts

---

## Tech Stack

- **React 18** + Vite
- **React Router v6**
- **CSS Variables** (no CSS framework — custom design system)
- **LocalStorage** for offline data persistence
- **Geolocation API** for GPS

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Browse places in Mangystau |
| `/place/:id` | Place Detail | Info, warnings, Mama says, gear |
| `/plan/:id` | Plan Trip | Configure and start trip |
| `/tracking` | Tracking | Live GPS, SOS button, Route Vibes |
| `/profile` | Profile | Tourist profile with PIN |
| `/admin` | MChS Panel | Admin view — all tourists |
| `/pin` | PIN Login | Emergency access from any phone |

---

## Deploy to GitHub Pages

1. Create GitHub repo named `deadend`
2. Push all code
3. Run `npm run deploy`
4. Enable GitHub Pages → `gh-pages` branch
5. App is live at `https://yourusername.github.io/deadend/`

---

## Demo Data

- **Demo user**: James Anderson · james@gmail.com
- **Demo PIN**: 482916
- **Demo places**: Bozzhyra tract, Ayraqty canyon, Sand beach, Mount Sherkala
- **Admin panel**: 4 mock tourists (active, overdue, completed, SOS)

---

*DeadEnd — because getting lost in Mangystau is beautiful, but getting found is better.* 🏔️
