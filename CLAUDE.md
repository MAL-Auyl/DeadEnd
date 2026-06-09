# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server → http://localhost:5173/
npm run build    # Production build
npm run preview  # Preview production build locally
npm run deploy   # Build + deploy to GitHub Pages (gh-pages branch)
```

No test suite or linter is configured.

## Architecture

Single-page React 18 + Vite app with React Router v6. No CSS framework — all styling lives in `src/index.css` using CSS custom properties (dark theme: `--bg`, `--purple`, `--teal`, `--red`, etc.). Fonts: Syne (headings) + DM Sans (body).

### Routing

`App.jsx` has three top-level route groups:

| Route | Component | Notes |
|-------|-----------|-------|
| `/mchs` | `MChSApp` → `AdminPanel` | Standalone, no app chrome |
| `/about` | `AboutUs` | Standalone, no app chrome |
| `/*` | `Layout` | TopNav + `<main>` with sub-routes |

**Standalone routes** (`/mchs`, `/about`) render full-screen outside `Layout`. They need their own scroll container (`height: 100vh; overflow-y: auto`) because `index.css` sets `overflow: hidden` on `html, body, #root`.

Sub-routes inside `Layout`:

| Path | Page |
|------|------|
| `/` | Home — place cards |
| `/place/:id` | PlaceDetail — info, alerts, weather, mama tips |
| `/plan/:id` | PlanTrip — configure group, vehicle, return time |
| `/tracking` | Tracking — live GPS, SOS button, checkpoints, radio |
| `/profile` | Profile — tourist info, badges |
| `/pin` | PinLogin — emergency SOS without login |
| `/about-old` | Landing — old marketing landing page |
| `/admin-login` | AdminLogin |

There is no `/admin` route — the admin panel lives at `/mchs`.

### State management

Two contexts:

**`src/context/TripContext.jsx`** — `TripProvider` / `useTrip()`:
- `user` — tourist profile (persisted as `deadend_user`)
- `activeTrip` — current trip object (persisted as `deadend_trip`); `null` when idle
- `notifications` — toast queue (auto-dismissed after 4 s)
- `currentCoords` — live GPS from `navigator.geolocation.watchPosition`
- `isOnline` — `navigator.onLine` with auto-sync on reconnect

Trip lifecycle: `startTrip()` → `updateCheckpoint()` / `triggerSOS()` → `stopTrip()`. All three have debounce locks (`useRef`). TripContext auto-escalates `activeTrip.status` from `active` → `overdue` when `expectedReturn` passes (fires every 60 s).

**`src/context/LangContext.jsx`** — `LangProvider` / `useLang()`:
- `lang` — current language: `'kz'` | `'ru'` | `'en'`
- `setLang(l)` — switches language app-wide
- `t` — flat translation object for the current language

### Data layer

All data is static mock — no backend:
- `src/data/places.js` — `PLACES[]`, `VIBES{}`, `MOCK_USER`, `ADMIN_CREDENTIALS`, `MOCK_ACTIVE_TOURISTS[]`
- `src/data/alerts.js` — `LIVE_ALERTS[]` (per-place safety alerts)

Admin credentials: `admin` / `mchs2024`. Demo PIN: `482916`.

`MOCK_ACTIVE_TOURISTS` includes a demo tourist (`t005`) whose `expectedReturn` is computed at module-load time as `now + 2 minutes`, so the auto-overdue transition is visible shortly after opening `/mchs`.

### Firebase / real-time sync

`src/lib/firebase.js` — initialises Firebase Realtime Database. Only active when `VITE_FIREBASE_DATABASE_URL` env var is set (`FIREBASE_ENABLED` flag).

`src/lib/sync.js` — thin wrappers:
- `listenTourists(cb)` — subscribes to live tourist updates; no-ops if Firebase disabled
- `sendSOSResponse(deviceId, step)` — pushes SOS status back to tourist device
- All functions guard with `if (!FIREBASE_ENABLED) return`

AdminPanel calls both; falls back gracefully to mock data when Firebase is off.

### AdminPanel (`/mchs`)

Full-screen ops dashboard — light theme (white surface `#ffffff`, bg `#f4f5f7`). Design tokens centralised in `const C = { ... }` at top of file.

Key behaviours:
- **Auto-overdue**: `applyEffectiveStatuses(tourists)` computes effective status from current time — `active` becomes `overdue` when `expectedReturn` has passed. A 30 s `setInterval` drives re-renders; amber toast fires on each new transition.
- **Operation modal**: SOS workflow stepper (new → enroute → search → found → closed). Each step fires `sendSOSResponse()` to notify the tourist's device.
- **Akimat view**: statistics tab with KPI cards, bar charts, route rankings, danger zones, and recommendations — toggled via the Операции / Акимат switcher.

### AboutUs (`/about`)

Standalone Emil Kowalski-style landing page. Uses `IntersectionObserver` (root: `.about-scroll` container) for scroll reveals. KZ/RU/EN translations via local `TX` object + `useLang()`. Responsive via `useWindowWidth` hook — all breakpoints are inline ternaries, not media queries (except helpers in `index.css` prefixed `.about-*`).

### Key components & hooks

- `src/hooks/useWeather.js` — fetches `open-meteo.com` API; exports `weatherIcon(code)` and `getMamaTips(weather)` (Kazakh-only tips)
- `src/components/WeatherWidget.jsx` — weather card with mama tips
- `src/components/LiveAlerts.jsx` — renders `LIVE_ALERTS` filtered by `placeId`
- `src/components/MapView.jsx` — Leaflet map (loaded via CDN `window.L`); used in AdminPanel's `MiniMap` sub-component for route visualisation

### Offline support

GPS coord updates are queued to `pendingSync.current[]` and saved as `deadend_pending` when offline. On reconnect, `syncPendingData()` flushes the queue and shows a notification.

### Deployment

`vercel.json` — SPA rewrite (`/* → /index.html`) for Vercel. `npm run deploy` — `gh-pages` branch for GitHub Pages.
