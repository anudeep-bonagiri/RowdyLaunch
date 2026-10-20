-- People who registered on the MLH event page. Loaded from MLH's CSV export
-- by scripts/import-mlh.mjs (the data never goes in this repo). They have no
-- site account; organizers see them in the roster and check them in.
create table public.mlh_registrations (
  mlh_id bigint primary key,
  email text not null,
  name text not null,
  phone text,
  dietary text,
  registered_at timestamptz not null,
  checked_in_at timestamptz
);
alter table public.mlh_registrations enable row level security;
revoke all on public.mlh_registrations from anon, authenticated;
grant select, update (checked_in_at) on public.mlh_registrations to authenticated;

create policy "organizers read mlh registrations" on public.mlh_registrations
  for select to authenticated using (public.is_organizer());
create policy "organizers check in mlh registrations" on public.mlh_registrations
  for update to authenticated using (public.is_organizer()) with check (public.is_organizer());
