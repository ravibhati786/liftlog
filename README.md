# LiftLog

A personal gym app for iPhone: ready-made 5-day plans, a set-by-set workout logger with rest
timer, automatic weight suggestions, and progress charts. It's a home-screen web app (PWA):
no App Store, no account, no server — your data stays on your phone.

## Features

- **Plans** — Upper/Lower/Push/Pull/Legs, Classic body-part split, Strength + Conditioning
  (all 5 days/week), plus a 3-day full-body plan for busy weeks. "Today" always shows the next
  workout in the rotation, so a missed day never breaks the plan.
- **Workout logger** — tap ✓ per set; weights carry down from the set above; rest timer with
  beep, ±15 s and skip; swap an exercise if a machine is busy; screen stays awake.
- **Progression** — shows what you did last time and suggests adding weight once you hit the
  top of the rep range on every set (double progression). Personal records are celebrated.
- **Progress** — workouts per week, streak, body-weight log, estimated 1RM chart per lift, history.
- **1,075 exercises** with animations and step-by-step instructions.
- **Backup** — Settings → Export backup (share to Files/iCloud Drive) and Import.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Put it on your iPhone

The app has to be served over HTTPS for offline mode. Any static host works (GitHub Pages,
Netlify, Cloudflare Pages). After it's online: open the URL in **Safari** → Share →
**Add to Home Screen**.

When you change any file, bump `VERSION` in `sw.js` so phones pick up the update.

## Project layout

- `index.html`, `css/app.css` — shell and styling
- `js/app.js` — all screens
- `js/plans.js` — the training plans (edit here to change exercises, sets, reps, rest)
- `js/store.js` — data saved in the browser's localStorage
- `js/exercises.js` — generated exercise library (see `scripts/build-exercises.mjs`)
- `sw.js`, `manifest.webmanifest`, `icons/` — offline + home-screen support

See [NOTICE.md](NOTICE.md) for exercise data credits.
