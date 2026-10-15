-- Accounts replace the anonymous manifest form. One registration per user.
-- Email and user_id come from the session (trigger), never from the form.
-- Organizers (allowlisted emails) can read every registration.
create table public.organizers (
  email text primary key
);
alter table public.organizers enable row level security;
revoke all on public.organizers from anon, authenticated;

create table public.registrations (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  phone text not null check (char_length(btrim(phone)) between 7 and 30),
  dietary text check (char_length(dietary) <= 300),
  extra_credit_class text check (char_length(extra_credit_class) <= 120),
  agreed boolean not null check (agreed),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.registrations enable row level security;
revoke all on public.registrations from anon, authenticated;
grant select, insert, update on public.registrations to authenticated;

create function public.registrations_stamp() returns trigger
language plpgsql set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.email := coalesce(auth.jwt() ->> 'email', new.email);
  new.updated_at := now();
  if tg_op = 'INSERT' then new.created_at := now(); else new.created_at := old.created_at; end if;
  return new;
end $$;
create trigger registrations_stamp before insert or update on public.registrations
  for each row execute function public.registrations_stamp();

create function public.is_organizer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organizers o
    where lower(o.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;
revoke execute on function public.is_organizer() from public, anon;
grant execute on function public.is_organizer() to authenticated;

create policy "read own registration" on public.registrations
  for select to authenticated using (auth.uid() = user_id);
create policy "organizers read all" on public.registrations
  for select to authenticated using (public.is_organizer());
create policy "create own registration" on public.registrations
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update own registration" on public.registrations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.organizers (email) values ('anudeep.bonagiri@gmail.com');
