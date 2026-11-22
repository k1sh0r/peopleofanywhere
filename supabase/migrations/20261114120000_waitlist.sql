-- The waitlist while the city is paused (claude.md: PAUSED; CITY_PAUSED in src/membership/waitlist.ts).
-- One row per email. Written only by the server (/api/waitlist, service role); nobody else can write it,
-- and only admins can read it (the /admin WAITLIST tab). No accounts are made for these people:
-- when the city reopens, they are let in with founder invite codes. Safe to re-run.

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (email = lower(email) and char_length(email) between 3 and 254),
  source     text not null default 'guest' check (source in ('guest', 'member', 'invite')),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

drop policy if exists "admins read the waitlist" on public.waitlist;
create policy "admins read the waitlist" on public.waitlist for select to authenticated using (public.is_admin());

-- explicit grants (see API GRANTS in 20261114000000_setup.sql): newer databases don't open new tables by default
revoke all on public.waitlist from anon, authenticated;
grant select on public.waitlist to authenticated;
grant all on public.waitlist to service_role;
