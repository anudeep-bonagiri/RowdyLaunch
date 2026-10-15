-- A random ticket code per registration, independent of the user id.
-- Eight characters from an alphabet without look-alike glyphs.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.gen_ticket() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(8);
  code text := '';
  i int;
begin
  for i in 0..7 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 31) + 1, 1);
  end loop;
  return code;
end $$;
revoke execute on function public.gen_ticket() from public, anon, authenticated;

alter table public.registrations add column ticket text;
update public.registrations set ticket = public.gen_ticket() where ticket is null;
alter table public.registrations alter column ticket set not null;
create unique index registrations_ticket_key on public.registrations (ticket);

-- Insert: the trigger assigns the code (callers cannot choose one).
-- Update: the code never changes; only organizers may change check-in.
create or replace function public.registrations_stamp() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.email := coalesce(auth.jwt() ->> 'email', new.email);
    new.created_at := now();
    new.ticket := public.gen_ticket();
    if not public.is_organizer() then new.checked_in_at := null; end if;
  else
    new.user_id := old.user_id;
    new.email := old.email;
    new.created_at := old.created_at;
    new.ticket := old.ticket;
    if new.checked_in_at is distinct from old.checked_in_at and not public.is_organizer() then
      new.checked_in_at := old.checked_in_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
