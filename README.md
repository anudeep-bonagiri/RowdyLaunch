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

## Registration portal (Supabase)

Registration lives on this site, not on MLH.

- **`/register`** (`src/components/Portal.tsx`): one screen with name, email, phone, dietary restrictions, optional extra-credit class, the terms and conditions chart (`terms` in `src/data.ts`), an agree checkbox, and a password chosen at the end. Submitting creates the Supabase Auth account and the `registrations` row in one go. No agreement, no account: the browser blocks the submit, the code blocks it again, and the database rejects a row with `agreed = false`. Email confirmation is off so the free tier's email limit cannot block signups.
- **Logged-in attendees** see a boarding pass styled as a ticket (passenger, flight RL-1031, gate, seat) with a QR code and an eight-character ticket code, plus a countdown, a pre-launch checklist, the schedule, and their details with an edit form. Ticket codes are random (`gen_ticket()` in the database, alphabet without look-alike glyphs), assigned by the insert trigger and never changeable from the client. The QR encodes `/organizer?code=XXXXXXXX`, so any phone camera works as a scanner. Actions under the pass: Add to Apple Wallet (Apple devices, only once the pass certificate is configured), Add to calendar (`public/hack-day.ics`), Map.
- **`/organizer`**: for emails in the `organizers` table. Totals, search by name, email, phone or ticket code, one-click check-in and undo, extra credit grouped by class, and an organizers panel to add or remove organizer emails. The first organizer was seeded by migration; after that, organizers manage the list themselves.
- Only organizers can set or clear `checked_in_at` and nobody can change a ticket code (both enforced in the `registrations_stamp` trigger). Attendees can only read and edit their own row. Anonymous requests get nothing. Returning attendees use "Already registered? Log in"; password resets go through Supabase's built-in mailer, which allows a few messages an hour.

### Apple Wallet passes

`api/pass.ts` is a Vercel function. `GET /api/pass` reports whether signing is configured; `POST /api/pass` with the attendee's access token in the form body verifies the token with Supabase, reads that person's registration under row-level security, and returns a signed `.pkpass` built by `lib/pass.ts` (artwork in `lib/passAssets.ts`, regenerated with `node scripts/pass-assets.mjs`). Apple only accepts passes signed with a Pass Type ID certificate. This is configured: the Pass Type ID `pass.com.rowdylaunch.hackday` and the certificate "RowdyLaunch Hack Day Pass 2026" (expires November 14, 2027) live in Anudeep's Apple Developer account (team 8878M838D7), and the five env vars are set on Vercel production. When the certificate expires, create a new one for the same Pass Type ID from a fresh CSR and run `scripts/wallet-env.sh` (or set the env vars by hand) with the new files. Vercel keeps the current key; `vercel env pull` retrieves it.

The Supabase project is `rowdylaunch` (ref `sejafunjijjhszotyiht`) in the org RowdyLaunch, dashboard at https://supabase.com/dashboard/project/sejafunjijjhszotyiht. Schema and policies are in `supabase/migrations`; auth settings (site URL, redirect URLs, 8-character minimum password, one auth email a minute) are in `supabase/config.toml`. The portal is code-split, so the event page never loads the Supabase client. `vercel.json` rewrites `/register` and `/organizer` to the app.

- **Run it locally:** copy `.env.example` to `.env.local` and fill in the project URL and publishable key from Project Settings, API Keys. Both are set on Vercel for production.
- **Change the schema:** add a file under `supabase/migrations`, then `supabase link --project-ref sejafunjijjhszotyiht` and `supabase db push`. Change auth settings in `config.toml` and run `npx supabase@latest config push` (the Homebrew 2.106 binary fails on a storage-schema mismatch).
- **After the event,** send each professor the checked-in names for their class from the organizer dashboard, then delete the registrations. The terms promise that.

The map in Ground control is a static render (`public/map.jpg`) of OpenStreetMap tiles around the Business Building, darkened to match the site. Re-render it if the venue changes; the attribution line on it is required by OpenStreetMap's licence.

## Assets

- `public/mascot.png` is the RowdyLaunch roadrunner: a founder in a hoodie sprinting on rocket boosters with a laptop bag. Generated with Gemini on 2026-10-14 from a RowdyLaunch prompt, background keyed out. Source files and two alternate directions (rocket rider, rocket mark) are in `~/Desktop/hacktoberfest/inspo/05-mascot`. Have it redrawn as a vector if it becomes the permanent org mascot.
- `public/logo.png` (nav mark) is the rocket-rider roadrunner. The favicon and app icons are the roadrunner rocket mark, which reads better small. Both from the same Gemini set, cut out and placed on the ship gunmetal. `public/og.png` is the link-preview image; regenerate it if the hero changes.
- Fonts are self-hosted in `public/fonts` (latin subsets of Unbounded, Sora and JetBrains Mono, OFL licensed).
- No MLH trust badge: that asset is for MLH Member Events. The event is linked from the nav, the hero and the footer instead.
