-- Only organizers can change checked_in_at. An attendee updating their own
-- row keeps whatever value the organizers set.
create or replace function public.registrations_stamp() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.email := coalesce(auth.jwt() ->> 'email', new.email);
    new.created_at := now();
    if not public.is_organizer() then new.checked_in_at := null; end if;
  else
    new.user_id := old.user_id;
    new.email := old.email;
    new.created_at := old.created_at;
    if new.checked_in_at is distinct from old.checked_in_at and not public.is_organizer() then
      new.checked_in_at := old.checked_in_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
