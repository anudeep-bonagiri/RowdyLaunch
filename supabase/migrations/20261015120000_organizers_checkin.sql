-- Check-in at the door and self-serve organizer management.
alter table public.registrations add column checked_in_at timestamptz;

-- On update keep the row's owner and email; only stamp them on insert.
-- Needed so organizers can update other people's rows (check-in).
create or replace function public.registrations_stamp() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.email := coalesce(auth.jwt() ->> 'email', new.email);
    new.created_at := now();
  else
    new.user_id := old.user_id;
    new.email := old.email;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$;

create policy "organizers update registrations" on public.registrations
  for update to authenticated using (public.is_organizer()) with check (public.is_organizer());

grant select, insert, delete on public.organizers to authenticated;
create policy "organizers manage organizers" on public.organizers
  for all to authenticated using (public.is_organizer()) with check (public.is_organizer());
