-- Manifest: the RSVP form on the site. One row per attendee.
-- The browser inserts as the anon role with the publishable key. Nothing
-- reads this table through the API; organizers read it in the dashboard.
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone text not null check (char_length(btrim(phone)) between 7 and 30),
  dietary text check (char_length(dietary) <= 300),
  extra_credit_class text check (char_length(extra_credit_class) <= 120),
  agreed boolean not null check (agreed)
);

create unique index rsvps_email_key on public.rsvps (lower(email));

alter table public.rsvps enable row level security;

revoke all on public.rsvps from anon, authenticated;
grant insert on public.rsvps to anon;

create policy "anyone can add themselves"
  on public.rsvps for insert to anon with check (true);
