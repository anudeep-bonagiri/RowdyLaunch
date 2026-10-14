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
- `sponsors` is empty. Add an entry with a logo under `public/sponsors/` and the logo grid appears.
- `crew[].line` and `crew[].url` are optional. Add a year and major or a GitHub link per person.
- `postEventUrl` is where the main button points after 5 PM on Oct 31.
- The T-minus clock reads `startISO` and switches to "Mission in progress" during the event window.

## How it is built

Vite, React, TypeScript, Framer Motion. No UI library.

The concept is the inside of a ship. The hero is a 260vh pinned scene: an SVG airlock (`src/components/Airlock.tsx`) with a transparent hatch, a sky view behind it, and a mascot on the walkway. As you scroll, the camera pushes through the hatch, the bulkheads scale out, and the page hands off to a fixed backdrop that goes from space to the Earth horizon by the time you reach Ground control. Sections are named as ship stations.

Design references, in priority order: the Octocat-at-the-airlock image in `~/Desktop/hacktoberfest/inspo`, and the hackathon site lookbook (LA Hacks for the pill nav and announcement toast, Hack the North for the backdrop that changes with the scroll, HackTX for turning the deadline into a prop).

## Assets

- `public/mascot.png` is the RowdyLaunch roadrunner: a founder in a hoodie sprinting on rocket boosters with a laptop bag. Generated with Gemini on 2026-10-14 from a RowdyLaunch prompt, background keyed out. Source files and two alternate directions (rocket rider, rocket mark) are in `~/Desktop/hacktoberfest/inspo/05-mascot`. Have it redrawn as a vector if it becomes the permanent org mascot.
- `public/logo.png` (nav mark) and the favicon and app icons are the rocket-rider roadrunner from the same Gemini set, cut out and placed on the ship gunmetal. `public/og.png` is the link-preview image; regenerate it if the hero changes.
- Fonts are self-hosted in `public/fonts` (latin subsets of Unbounded, Sora and JetBrains Mono, OFL licensed).
- No MLH trust badge: that asset is for MLH Member Events. The event is linked from the nav, the hero and the footer instead.
