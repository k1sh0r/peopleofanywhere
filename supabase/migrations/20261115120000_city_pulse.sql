-- The numbers in the paused title screen's top panel (claude.md: PAUSED). Only shown while CITY_PAUSED is on.
-- One row, written by scripts/pulse/pulse.mjs (service role) every couple of minutes; anyone may read it.
-- The panel shows whatever this row holds: the seed is all zeros, and whatever you run against it (scripts/pulse) is
-- what visitors see. Prefer real counts (members online, people on the waitlist) over invented ones. Safe to re-run.

create table if not exists public.city_pulse (
  id                int primary key default 1 check (id = 1),
  recruiters_online int not null check (recruiters_online >= 0),
  recruiters_total  int not null check (recruiters_total >= 0),
  members_online    int not null check (members_online >= 0),
  members_total     int not null check (members_total >= 0),
  waiting           int not null check (waiting >= 0),
  updated_at        timestamptz not null default now()
);

insert into public.city_pulse (id, recruiters_online, recruiters_total, members_online, members_total, waiting)
values (1, 0, 0, 0, 0, 0)
on conflict (id) do nothing;

alter table public.city_pulse enable row level security;

drop policy if exists "the pulse is public" on public.city_pulse;
create policy "the pulse is public" on public.city_pulse for select to anon, authenticated using (true);

-- explicit grants (see API GRANTS in 20261114000000_setup.sql): read for everyone, writes only by the server's key
revoke all on public.city_pulse from anon, authenticated;
grant select on public.city_pulse to anon, authenticated;
grant all on public.city_pulse to service_role;
