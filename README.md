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

Registration lives on this site at `/register` (`src/components/Portal.tsx`), not on MLH. Supabase Auth handles accounts with email and password; email confirmation is off so the free tier's email limit cannot block signups. After signing in, attendees fill one form (name, phone, dietary restrictions, optional extra-credit class, liability checkbox) that writes their row in `registrations`. They see a boarding pass with their details and can edit them until the event ends. Anyone whose email is in the `organizers` table sees the full roster on the same page with a CSV download.

The Supabase project is `rowdylaunch` (ref `sejafunjijjhszotyiht`) in the org RowdyLaunch, dashboard at https://supabase.com/dashboard/project/sejafunjijjhszotyiht. Schema and policies are in `supabase/migrations`; auth settings (site URL, redirect URLs, 8-character minimum password) are in `supabase/config.toml`. The portal is code-split, so the event page never loads the Supabase client. `vercel.json` rewrites `/register` to the app.

- **Add an organizer:** in the dashboard SQL editor, `insert into public.organizers (email) values ('name@example.com');`. The person signs in with that email and the roster appears.
- **Run it locally:** copy `.env.example` to `.env.local` and fill in the project URL and publishable key from Project Settings, API Keys. Both are set on Vercel for production.
- **Change the schema:** add a file under `supabase/migrations`, then `supabase link --project-ref sejafunjijjhszotyiht` and `supabase db push`. Change auth settings in `config.toml` and run `supabase config push`.
- **Password resets** go through Supabase's built-in email, which is limited to a few messages an hour. If that bites, set up custom SMTP (Resend works) under Authentication, SMTP settings.
- **After the event,** export the roster to CSV, then delete the rows. There is no reason to keep phone numbers.

## Assets

- `public/mascot.png` is the RowdyLaunch roadrunner: a founder in a hoodie sprinting on rocket boosters with a laptop bag. Generated with Gemini on 2026-10-14 from a RowdyLaunch prompt, background keyed out. Source files and two alternate directions (rocket rider, rocket mark) are in `~/Desktop/hacktoberfest/inspo/05-mascot`. Have it redrawn as a vector if it becomes the permanent org mascot.
- `public/logo.png` (nav mark) is the rocket-rider roadrunner. The favicon and app icons are the roadrunner rocket mark, which reads better small. Both from the same Gemini set, cut out and placed on the ship gunmetal. `public/og.png` is the link-preview image; regenerate it if the hero changes.
- Fonts are self-hosted in `public/fonts` (latin subsets of Unbounded, Sora and JetBrains Mono, OFL licensed).
- No MLH trust badge: that asset is for MLH Member Events. The event is linked from the nav, the hero and the footer instead.
