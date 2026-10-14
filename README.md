# RowdyLaunch

Website for **Hacktoberfest Hack Day San Antonio x RowdyLaunch**, Saturday October 31, 2026, 10 AM to 5 PM at the UTSA Business Building.

Event page and registration: https://events.mlh.com/events/15160-hacktoberfest-hack-day-san-antonio-x-rowdylaunch

## Run it

```
npm install
npm run dev
```

`npm run build` type-checks and writes `dist/`. Deploys as a static site anywhere (Vercel, Netlify, GitHub Pages).

## Edit the content

Everything factual lives in `src/data.ts`: dates, venue, links, crew, schedule, FAQ. Components read from it, so you should rarely need to touch them to change words.

- The schedule is marked `draft: true`. Flip it once the agenda is confirmed and the "Draft schedule" badge disappears.
- `contactEmail` is empty. Fill it in to show a sponsor contact button.
- The T-minus clock reads `startISO` and switches to "Mission in progress" during the event window.

## How it is built

Vite, React, TypeScript, Framer Motion. No UI library.

The concept is the inside of a ship. The hero is a 260vh pinned scene: an SVG airlock (`src/components/Airlock.tsx`) with a transparent hatch, a sky view behind it, and a mascot on the walkway. As you scroll, the camera pushes through the hatch, the bulkheads scale out, and the page hands off to a fixed backdrop that goes from space to the Earth horizon by the time you reach Ground control. Sections are named as ship stations.

Design references, in priority order: the Octocat-at-the-airlock image in `~/Desktop/hacktoberfest/inspo`, and the hackathon site lookbook (LA Hacks for the pill nav and announcement toast, Hack the North for the backdrop that changes with the scroll, HackTX for turning the deadline into a prop).

## Assets

- `public/mascot.png` is Jetpacktocat from GitHub's Octodex (https://octodex.github.com/). GitHub owns the Octocat. It is used here for a free, non-commercial Hacktoberfest community event with a credit in the footer. Swap it for original art if that ever changes.
- `public/favicon.svg` is drawn in place.
- Fonts come from Google Fonts: Unbounded (display), Sora (body), JetBrains Mono (readouts).
