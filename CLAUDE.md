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

Single-page React 18 + Vite app with React Router v6. No CSS framework — all styling lives in `src/index.css` using CSS custom properties (dark theme, `--bg`, `--purple`, `--teal`, `--red`, etc.). Fonts: Syne (headings) + DM Sans (body).

### State management

All global state lives in `src/context/TripContext.jsx` via `TripProvider` / `useTrip()`. It owns:
- **user** — tourist profile (persisted to `localStorage` as `deadend_user`)
- **activeTrip** — current trip object (persisted as `deadend_trip`); `null` when no trip
- **notifications** — toast queue (auto-dismissed after 4 s)
- **currentCoords** — live GPS coords from `navigator.geolocation.watchPosition`
- **isOnline** — `navigator.onLine` state with auto-sync on reconnect

Trip lifecycle: `startTrip()` → `updateCheckpoint()` / `triggerSOS()` → `stopTrip()`. All three have debounce locks (`useRef`) to prevent duplicate calls.

### Data layer

All data is static mock data — there is no backend:
- `src/data/places.js` — `PLACES[]`, `VIBES{}`, `MOCK_USER`, `ADMIN_CREDENTIALS`, `MOCK_ACTIVE_TOURISTS[]`
- `src/data/alerts.js` — `LIVE_ALERTS[]` (per-place safety alerts)

Admin credentials are hardcoded: `admin` / `mchs2024`. Demo PIN: `482916`.

### Routing

`App.jsx` renders a two-column layout: `<Sidebar>` (always visible) + `<main>` with routes. Route guard `<ProtectedRoute role="admin">` redirects non-admins to `/admin-login`.

| Route | Page |
|-------|------|
| `/` | Home — place cards |
| `/place/:id` | PlaceDetail — info, warnings, live alerts, mama tips, weather |
| `/plan/:id` | PlanTrip — configure trip (group, vehicle, return time) |
| `/tracking` | Tracking — live GPS, SOS, checkpoint list, Route Vibes radio |
| `/profile` | Profile — edit tourist info, view badges |
| `/pin` | PinLogin — emergency SOS without login |
| `/admin-login` | AdminLogin |
| `/admin` | AdminPanel — MChS dashboard (protected) |

### Key components & hooks

- `src/hooks/useWeather.js` — fetches from `open-meteo.com` API using place `coords`; also exports `weatherIcon(code)` and `getMamaTips(weather)` (returns Kazakh-language tips)
- `src/components/WeatherWidget.jsx` — renders weather card with mama tips
- `src/components/LiveAlerts.jsx` — renders `LIVE_ALERTS` filtered by `placeId`
- `src/components/MapView.jsx` — static map placeholder (no real map library)

### Multilingual content

Place data has parallel `name`/`nameKz`, `description`/`descriptionKz`, `title`/`titleKz`, `tip`/`tipKz` fields. Weather mama tips from `getMamaTips()` are Kazakh-only. No i18n library — language toggle not yet implemented.

### Offline support

When `navigator.onLine` is false, GPS coord updates are pushed to `pendingSync.current[]` and saved to `localStorage` as `deadend_pending`. On reconnect, `syncPendingData()` clears the queue and shows a notification.

### Deployment

`vercel.json` configures SPA rewrites (`/* → /index.html`) for Vercel. `npm run deploy` uses `gh-pages` for GitHub Pages deployment.
