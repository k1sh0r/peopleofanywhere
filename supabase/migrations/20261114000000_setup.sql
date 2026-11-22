-- ===========================================================================
-- SETUP: the whole database schema, for a fresh Supabase project.
--
-- Run once (supabase db push, or paste into the SQL editor). It creates every table, row-level security
-- policy, function, trigger, grant and the scheduled job the game needs.
--
-- By hand afterwards (never in a migration, never committed):
--   1. Vault secrets for the scheduled job (see SCHEDULED JOBS):
--        select vault.create_secret('https://your-site.example', 'site_url');
--        select vault.create_secret('<CRON_SECRET>', 'cron_secret');
--   2. Your admins: insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
--   3. Founder invite codes: select public.issue_invites(null, 5);  (or /admin → INVITES)
--   4. app_settings.dodo_product_id: your Dodo Payments product ids, if you take payments.
-- ===========================================================================

-- ===========================================================================
-- SETTINGS
-- Config-driven: change these rows without a release.
-- ===========================================================================

create table if not exists public.app_settings (
  key   text primary key,
  value jsonb not null
);

insert into public.app_settings (key, value) values
  -- invites
  ('invites_per_member', '2'),
  ('invite_sent_expiry_days', '30'),
  -- the application fee, and the Dodo product that charges it, per mode (test / live = production only)
  ('application_fee', '{"amount": 1000, "currency": "USD"}'),
  ('dodo_product_id', '{"test": null, "live": null}'),
  ('review_auto_refund_days', '14'),
  -- connect
  ('connect_daily_limit', '10'),
  ('connect_expiry_days', '14'),
  ('connect_cooldown_days', '30')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

create policy "settings are public" on public.app_settings for select using (true);

create or replace function public.setting_int(p_key text, p_default int) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from public.app_settings where key = p_key), p_default)
$$;

-- ===========================================================================
-- PROFILES
-- One row per member. New profiles start 'pending'; an admin approves them before anyone else can see them.
-- ===========================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text not null check (char_length(name) between 2 and 40),
  role          text not null check (char_length(role) between 2 and 60),
  company       text check (char_length(company) <= 60),
  location      text not null default 'Design Quarter' check (char_length(location) <= 40),
  building      text check (char_length(building) <= 80),
  previously    text check (char_length(previously) <= 80),
  open_to_work  boolean not null default false,
  skills        text[] not null default '{}' check (cardinality(skills) <= 6),
  portfolio     text check (portfolio ~ '^https://[^\s]+$' and char_length(portfolio) <= 200),
  linkedin      text check (linkedin ~ '^https://(www\.)?linkedin\.com/[^\s]+$' and char_length(linkedin) <= 200),
  x             text check (x ~ '^https://(x|twitter)\.com/[A-Za-z0-9_]{1,15}/?$'),
  character     text not null default 'designer' check (char_length(character) <= 30),
  spot          text not null default 'junction' check (char_length(spot) <= 30),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'hidden', 'rejected')),
  -- who vouched for you (an invite code's owner); a reviewer's note on your application
  invited_by    uuid references auth.users (id) on delete set null,
  review_note   text check (char_length(review_note) <= 400),
  -- your status above your head ("note": profiles.status is already approval). null expiry = don't clear.
  -- One emoji may be several code points (skin tones, flags, ZWJ sequences).
  note_text     text constraint profiles_note_text_check check (note_text is null or char_length(note_text) between 1 and 100),
  note_emoji    text constraint profiles_note_emoji_check check (note_emoji is null or char_length(note_emoji) between 1 and 16),
  note_expires_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable when approved or own"
  on public.profiles for select
  using (status = 'approved' or auth.uid() = id);

create policy "insert own pending profile"
  on public.profiles for insert
  with check (auth.uid() = id and status = 'pending');

create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Nobody but an admin (service role / dashboard) may change status.
revoke update on public.profiles from anon, authenticated;

grant update (name, role, company, location, building, previously, open_to_work, skills,
              portfolio, linkedin, x, character, spot, updated_at)
  on public.profiles to authenticated;

-- Members change their own status at any time, without re-approval. The existing
-- "update own profile" policy keeps it to your own row; this only opens the columns.
grant update (note_text, note_emoji, note_expires_at) on public.profiles to authenticated;

create or replace function public.touch_profile() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_profile();

-- ===========================================================================
-- ADMINS
-- Reviewers and moderators. Added by hand (see the top of this file).
-- ===========================================================================

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

grant execute on function public.is_admin() to authenticated;

-- Moderation: an admin can clear anyone's status (from the SQL editor).
create or replace function public.admin_clear_status(p_user uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'admins only';
  end if;
  update public.profiles set note_text = null, note_emoji = null, note_expires_at = null where id = p_user;
end $$;

revoke execute on function public.admin_clear_status(uuid) from public, anon;

grant execute on function public.admin_clear_status(uuid) to authenticated;

-- ===========================================================================
-- INVITES
-- Being visible is earned: an invite code (instant, no review) or a reviewed application.
-- ===========================================================================

-- Invite codes
create table if not exists public.invites (
  code        text primary key check (code ~ '^ANY-[A-Z0-9]{6}$'),
  -- null = a founder code made by the admin
  owner       uuid references auth.users (id) on delete cascade,
  state       text not null default 'available' check (state in ('available', 'sent', 'used', 'revoked', 'expired')),
  created_at  timestamptz not null default now(),
  -- creating an invite link for someone starts the expiry clock
  sent_at     timestamptz,
  used_by     uuid references auth.users (id) on delete set null,
  used_at     timestamptz,
  note        text check (char_length(note) <= 120),
  -- on a fresh code that replaced an unused link: that link's "who's it for" ('' when it had none)
  renewed_from text check (char_length(renewed_from) <= 40)
);

create index if not exists invites_owner on public.invites (owner);

alter table public.invites enable row level security;

create policy "read own invites" on public.invites for select using (auth.uid() = owner);

revoke insert, update, delete on public.invites from anon, authenticated;

-- 6 characters from an alphabet without look-alikes (no 0/O, 1/I/L): ~887M codes.
create or replace function public.gen_invite_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  c text;
begin
  loop
    c := 'ANY-';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.invites where code = c);
  end loop;
  return c;
end $$;

-- Give someone (or, with null, nobody: founder codes) n fresh codes.
create or replace function public.issue_invites(p_owner uuid, p_n int) returns setof text
language plpgsql volatile security definer set search_path = public as $$
declare
  c text;
begin
  for i in 1..greatest(p_n, 0) loop
    c := public.gen_invite_code();
    insert into public.invites (code, owner) values (c, p_owner);
    return next c;
  end loop;
end $$;

-- Only the admin (SQL editor / service role) may mint codes.
revoke execute on function public.issue_invites(uuid, int) from public, anon, authenticated;

revoke execute on function public.gen_invite_code() from public, anon, authenticated;

-- What a code is worth, without using it: ok / invalid / used / expired / own.
-- An expired code reads as expired whether or not it has been renewed yet.
create or replace function public.invite_state(r public.invites) returns text
language sql stable security definer set search_path = public as $$
  select case
    when r.code is null then 'invalid'
    when r.state = 'revoked' then 'invalid'
    when r.state = 'used' then 'used'
    when r.state = 'expired' then 'expired'
    when r.state = 'sent' and r.sent_at < now() - make_interval(days => public.setting_int('invite_sent_expiry_days', 30)) then 'expired'
    when r.owner is not null and r.owner = auth.uid() then 'own'
    else 'ok'
  end
$$;

-- The gate's CHECK button. Returns the inviter's name so the gate can say who vouched.
create or replace function public.check_invite(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  r public.invites;
  st text;
  who public.profiles;
begin
  select * into r from public.invites where code = upper(trim(p_code));
  st := public.invite_state(r);
  if st <> 'ok' then
    return jsonb_build_object('state', st);
  end if;
  select * into who from public.profiles where id = r.owner;
  return jsonb_build_object(
    'state', 'ok',
    'inviter_name', coalesce(who.name, 'The founders'),
    'inviter_role', coalesce(who.role, 'People of Anywhere')
  );
end $$;

grant execute on function public.check_invite(text) to anon, authenticated;

-- End of the invite path, after the code sign-in: in ONE transaction the code is
-- re-checked and marked used, your profile goes live (approved, no review), and you get
-- your own codes to share.
create or replace function public.redeem_invite(p_code text, p_profile jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  r public.invites;
  st text;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'state', 'signed_out');
  end if;

  select * into r from public.invites where code = upper(trim(p_code)) for update;
  st := public.invite_state(r);
  if st <> 'ok' then
    return jsonb_build_object('ok', false, 'state', st);
  end if;

  insert into public.profiles as p (
    id, name, role, company, location, building, previously, open_to_work, skills,
    portfolio, linkedin, x, character, spot, status, invited_by
  ) values (
    uid,
    p_profile ->> 'name',
    p_profile ->> 'role',
    nullif(p_profile ->> 'company', ''),
    coalesce(nullif(p_profile ->> 'location', ''), 'Design Quarter'),
    nullif(p_profile ->> 'building', ''),
    nullif(p_profile ->> 'previously', ''),
    coalesce((p_profile ->> 'open_to_work')::boolean, false),
    coalesce(array(select jsonb_array_elements_text(p_profile -> 'skills')), '{}'),
    nullif(p_profile ->> 'portfolio', ''),
    nullif(p_profile ->> 'linkedin', ''),
    nullif(p_profile ->> 'x', ''),
    coalesce(nullif(p_profile ->> 'character', ''), 'designer'),
    coalesce(nullif(p_profile ->> 'spot', ''), 'junction'),
    'approved',
    r.owner
  )
  on conflict (id) do update set
    name = excluded.name, role = excluded.role, company = excluded.company,
    location = excluded.location, building = excluded.building, previously = excluded.previously,
    open_to_work = excluded.open_to_work, skills = excluded.skills, portfolio = excluded.portfolio,
    linkedin = excluded.linkedin, x = excluded.x, character = excluded.character, spot = excluded.spot,
    -- an invite approves an application that was waiting (or turned down) too
    status = 'approved', invited_by = excluded.invited_by;

  update public.invites set state = 'used', used_by = uid, used_at = now() where code = r.code;

  if not exists (select 1 from public.invites where owner = uid) then
    perform public.issue_invites(uid, public.setting_int('invites_per_member', 2));
  end if;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.redeem_invite(text, jsonb) to authenticated;

-- create_invite_link: one of your ready codes becomes a sent link
create or replace function public.create_invite_link(p_code text, p_note text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  r public.invites;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'state', 'signed_out');
  end if;
  select * into r from public.invites where code = upper(trim(p_code)) and owner = uid for update;
  if r.code is null then
    return jsonb_build_object('ok', false, 'state', 'invalid');
  end if;
  if r.state <> 'available' then
    return jsonb_build_object('ok', false, 'state', r.state);
  end if;
  update public.invites
    set state = 'sent', sent_at = now(), note = left(nullif(trim(coalesce(p_note, '')), ''), 40)
    where code = r.code
    returning * into r;
  return jsonb_build_object('ok', true, 'code', r.code, 'sent_at', r.sent_at);
end $$;

revoke execute on function public.create_invite_link(text, text) from public, anon;

grant execute on function public.create_invite_link(text, text) to authenticated;

-- my_invites: renew unused links, then list your slots
create or replace function public.my_invites() returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  exp_days int := public.setting_int('invite_sent_expiry_days', 30);
  old record;
  fresh text;
begin
  if uid is null then
    return '[]'::jsonb;
  end if;

  -- a link unused for exp_days is dead; its slot comes back as a fresh code
  for old in
    select code, note from public.invites
    where owner = uid and state = 'sent' and sent_at < now() - make_interval(days => exp_days)
    for update
  loop
    update public.invites set state = 'expired' where code = old.code;
    fresh := public.gen_invite_code();
    insert into public.invites (code, owner, renewed_from) values (fresh, uid, coalesce(old.note, ''));
  end loop;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'code', i.code,
      'state', i.state,
      'note', i.note,
      'sent_at', i.sent_at,
      'expires_at', case when i.sent_at is null then null else i.sent_at + make_interval(days => exp_days) end,
      'renewed_from', i.renewed_from,
      'joined', case when i.state = 'used' then jsonb_build_object(
        'name', coalesce(p.name, 'A new member'),
        'role', p.role,
        'at', i.used_at
      ) end
    ) order by i.created_at, i.code)
    from public.invites i
    left join public.profiles p on p.id = i.used_by and p.status = 'approved'
    where i.owner = uid and i.state in ('available', 'sent', 'used')
  ), '[]'::jsonb);
end $$;

revoke execute on function public.my_invites() from public, anon;

grant execute on function public.my_invites() to authenticated;

-- Founder codes in /admin: admins mint them (no owner) in batches with a label, see each one's state and who joined with it, rename the label
-- (who it went to) and revoke a code that hasn't been used. Every function checks is_admin() itself.

-- Mint p_n founder codes (1–200), all with the same label.
create or replace function public.admin_issue_invites(p_n int, p_note text default null) returns setof text
language plpgsql volatile security definer set search_path = public as $$
declare
  c text;
  n text := left(nullif(trim(coalesce(p_note, '')), ''), 120);
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if p_n is null or p_n < 1 or p_n > 200 then raise exception 'between 1 and 200 codes at a time'; end if;
  for c in select * from public.issue_invites(null, p_n) loop
    if n is not null then update invites set note = n where code = c; end if;
    return next c;
  end loop;
end $$;

-- Every founder code, newest first, with who joined with it.
create or replace function public.admin_founder_invites()
returns table (code text, state text, note text, created_at timestamptz, used_at timestamptz,
               used_by uuid, used_name text, used_role text, used_status text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  return query
    select i.code, i.state, i.note, i.created_at, i.used_at, i.used_by, p.name, p.role, p.status
      from invites i
      left join profiles p on p.id = i.used_by
     where i.owner is null
     order by i.created_at desc, i.code;
end $$;

-- Who a founder code went to (or the batch label). Empty clears it.
create or replace function public.admin_set_invite_note(p_code text, p_note text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  update invites set note = left(nullif(trim(coalesce(p_note, '')), ''), 120)
   where code = upper(trim(p_code)) and owner is null;
  return jsonb_build_object('ok', found);
end $$;

-- Kill a founder code that hasn't been used (it then answers "invalid" at the gate).
create or replace function public.admin_revoke_invite(p_code text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  update invites set state = 'revoked'
   where code = upper(trim(p_code)) and owner is null and state in ('available', 'sent');
  return jsonb_build_object('ok', found);
end $$;

revoke execute on function
  public.admin_issue_invites(int, text), public.admin_founder_invites(),
  public.admin_set_invite_note(text, text), public.admin_revoke_invite(text)
from public, anon;

grant execute on function
  public.admin_issue_invites(int, text), public.admin_founder_invites(),
  public.admin_set_invite_note(text, text), public.admin_revoke_invite(text)
to authenticated;

-- ===========================================================================
-- APPLICATIONS + REVIEW
-- The way in without an invite: profile + WHY HERE?, (optionally) a payment, then a reviewer decides.
-- Payment and refund states are written by the server only, after Dodo confirms them.
-- ===========================================================================

create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  email       text not null check (char_length(email) <= 254),

  -- the question: WHY HERE?
  why         text not null check (char_length(why) between 20 and 400),
  -- optional, so a reviewer can reach the applicant; never copied to the profile, never shown in the city
  whatsapp    text check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),

  -- the profile they built, exactly as the reviewer sees it; becomes their profile on approval
  profile     jsonb not null,

  status      text not null default 'submitted' check (status in (
                'draft', 'submitted', 'paid', 'under_review', 'approved', 'rejected', 'refunded', 'refund_failed')),

  -- Dodo Payments + review
  payment_id  text,
  checkout_id text,
  refund_id   text,
  amount      int check (amount >= 0),
  currency    text check (char_length(currency) = 3),
  reviewer    uuid references auth.users (id) on delete set null,
  reason      text check (char_length(reason) <= 400),
  paid_at     timestamptz,
  decided_at  timestamptz,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One open application per person (= per email: one account per email).
create unique index if not exists applications_one_open
  on public.applications (user_id) where status not in ('rejected', 'refunded');

create index if not exists applications_queue on public.applications (status, created_at);

create index if not exists applications_payment on public.applications (payment_id);

alter table public.applications enable row level security;

create policy "read own or admin" on public.applications for select
  using (auth.uid() = user_id or public.is_admin());

-- Nobody writes directly: submit_application() below (and the server) do.
-- So nobody can set their own status.
revoke insert, update, delete on public.applications from anon, authenticated;

create trigger applications_touch before update on public.applications
  for each row execute function public.touch_profile();

-- submit_application(answers, profile)
-- Signed-in only (the emailed code confirmed the email). Creates the application, or
-- updates it while it is still unpaid. Returns:
--   { ok: true, id, status }
--   { ok: false, state: signed_out | member | in_review | invalid }
create or replace function public.submit_application(p_answers jsonb, p_profile jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  mail text := auth.jwt() ->> 'email';
  cur public.applications;
  new_id uuid;
  wa text := nullif(trim(coalesce(p_answers ->> 'whatsapp', '')), '');
begin
  if uid is null or mail is null then
    return jsonb_build_object('ok', false, 'state', 'signed_out');
  end if;

  -- already in the city: nothing to apply for
  if exists (select 1 from public.profiles where id = uid and status = 'approved') then
    return jsonb_build_object('ok', false, 'state', 'member');
  end if;

  if char_length(coalesce(p_profile ->> 'name', '')) < 2 or char_length(coalesce(p_profile ->> 'role', '')) < 2 then
    return jsonb_build_object('ok', false, 'state', 'invalid');
  end if;

  select * into cur from public.applications
    where user_id = uid and status not in ('rejected', 'refunded')
    for update;

  if cur.id is not null and cur.status not in ('draft', 'submitted') then
    -- paid: the reviewer is looking at exactly what was paid for
    return jsonb_build_object('ok', false, 'state', 'in_review', 'status', cur.status);
  end if;

  begin
    if cur.id is not null then
      update public.applications set
        email = mail,
        why = trim(p_answers ->> 'why'),
        whatsapp = wa,
        profile = p_profile,
        status = 'submitted'
      where id = cur.id;
      new_id := cur.id;
    else
      insert into public.applications (user_id, email, why, whatsapp, profile)
      values (
        uid, mail,
        trim(p_answers ->> 'why'),
        wa,
        p_profile
      )
      returning id into new_id;
    end if;
  exception when check_violation or not_null_violation then
    return jsonb_build_object('ok', false, 'state', 'invalid');
  end;

  return jsonb_build_object('ok', true, 'id', new_id, 'status', 'submitted');
end $$;

revoke execute on function public.submit_application(jsonb, jsonb) from public, anon;

grant execute on function public.submit_application(jsonb, jsonb) to authenticated;

-- Free applications (APPLICATIONS_FREE in src/membership/applyFlags.ts): the applicant does not confirm their email first.
-- /api/apply/submit (service role) finds or creates the account for that email and
-- puts the application straight into the review queue. They sign in with an emailed code once approved.
create or replace function public.submit_application_for(p_email text, p_answers jsonb, p_profile jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  uid uuid;
  mail text;
  confirmed timestamptz;
  cur public.applications;
  new_id uuid;
  wa text := nullif(trim(coalesce(p_answers ->> 'whatsapp', '')), '');
begin
  select id, email, email_confirmed_at into uid, mail, confirmed from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if uid is null then
    return jsonb_build_object('ok', false, 'state', 'no_user');
  end if;

  if exists (select 1 from public.profiles where id = uid and status = 'approved') then
    return jsonb_build_object('ok', false, 'state', 'member');
  end if;

  -- nobody signed in here, so never touch an account someone has proven: they apply signed in
  if confirmed is not null then
    return jsonb_build_object('ok', false, 'state', 'signin_required');
  end if;

  if char_length(coalesce(p_profile ->> 'name', '')) < 2 or char_length(coalesce(p_profile ->> 'role', '')) < 2 then
    return jsonb_build_object('ok', false, 'state', 'invalid');
  end if;

  select * into cur from public.applications
    where user_id = uid and status not in ('rejected', 'refunded')
    for update;

  -- an open application is never rewritten from outside: the reviewer keeps what was sent
  if cur.id is not null then
    return jsonb_build_object('ok', false, 'state',
      case when cur.status in ('draft', 'submitted') then 'signin_required' else 'in_review' end);
  end if;

  begin
    insert into public.applications (user_id, email, why, whatsapp, profile, status)
    values (uid, mail, trim(p_answers ->> 'why'), wa, p_profile, 'under_review')
    returning id into new_id;
  exception when check_violation or not_null_violation then
    return jsonb_build_object('ok', false, 'state', 'invalid');
  end;

  return jsonb_build_object('ok', true, 'id', new_id, 'status', 'under_review');
end $$;

-- the server only: anyone could otherwise apply in someone else's name without the route's checks
revoke execute on function public.submit_application_for(text, jsonb, jsonb) from public, anon, authenticated;

grant execute on function public.submit_application_for(text, jsonb, jsonb) to service_role;

-- ACCEPT. Admins only (checked inside, so it can be called straight from the admin page).
-- In one transaction: the profile snapshot becomes a live profile (approved), the new
-- member gets their invite codes, and the application is marked approved.
create or replace function public.approve_application(p_id uuid, p_note text default null) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  a public.applications;
  p jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'state', 'not_admin');
  end if;

  select * into a from public.applications where id = p_id for update;
  if a.id is null then
    return jsonb_build_object('ok', false, 'state', 'missing');
  end if;
  if a.status not in ('paid', 'under_review') then
    return jsonb_build_object('ok', false, 'state', 'not_reviewable', 'status', a.status);
  end if;

  p := a.profile;
  insert into public.profiles as pr (
    id, name, role, company, location, building, previously, open_to_work, skills,
    portfolio, linkedin, x, character, spot, status
  ) values (
    a.user_id,
    p ->> 'name',
    p ->> 'role',
    nullif(p ->> 'company', ''),
    coalesce(nullif(p ->> 'location', ''), 'Design Quarter'),
    nullif(p ->> 'building', ''),
    nullif(p ->> 'previously', ''),
    coalesce((p ->> 'open_to_work')::boolean, false),
    coalesce(array(select jsonb_array_elements_text(p -> 'skills')), '{}'),
    nullif(p ->> 'portfolio', ''),
    nullif(p ->> 'linkedin', ''),
    nullif(p ->> 'x', ''),
    coalesce(nullif(p ->> 'character', ''), 'designer'),
    coalesce(nullif(p ->> 'spot', ''), 'junction'),
    'approved'
  )
  on conflict (id) do update set
    name = excluded.name, role = excluded.role, company = excluded.company,
    location = excluded.location, building = excluded.building, previously = excluded.previously,
    open_to_work = excluded.open_to_work, skills = excluded.skills, portfolio = excluded.portfolio,
    linkedin = excluded.linkedin, x = excluded.x, character = excluded.character, spot = excluded.spot,
    status = 'approved';

  if not exists (select 1 from public.invites where owner = a.user_id) then
    perform public.issue_invites(a.user_id, public.setting_int('invites_per_member', 2));
  end if;

  update public.applications
    set status = 'approved', reviewer = auth.uid(), reason = nullif(trim(p_note), ''), decided_at = now()
    where id = a.id;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.approve_application(uuid, text) to authenticated;

-- ===========================================================================
-- CONNECT
-- Discovery → intent → mutual match. connections has no client access at all: everything goes through
-- the functions below, so a decline can never be read by the sender.
-- ===========================================================================

create table if not exists public.connections (
  id            uuid primary key default gen_random_uuid(),
  from_id       uuid not null references public.profiles (id) on delete cascade,
  to_id         uuid not null references public.profiles (id) on delete cascade,
  intent        text not null check (intent in ('coffee', 'work', 'ideas', 'build', 'hangout')),
  status        text not null default 'pending'
                check (status in ('pending', 'accepted', 'declined', 'expired', 'withdrawn', 'removed')),
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  -- the recipient has seen the request · the sender has seen the match
  to_seen_at    timestamptz,
  from_seen_at  timestamptz,
  -- the optional note sent with the request
  note          text check (char_length(note) <= 200),
  -- chat: last message, read and last-emailed marks per side
  last_message_at timestamptz,
  from_read_at  timestamptz,
  to_read_at    timestamptz,
  from_emailed_at timestamptz,
  to_emailed_at timestamptz,
  check (from_id <> to_id)
);

-- one open request or connection per pair, whichever way round
create unique index if not exists connections_open_pair
  on public.connections (least(from_id, to_id), greatest(from_id, to_id))
  where status in ('pending', 'accepted');

create index if not exists connections_to on public.connections (to_id, status);

create index if not exists connections_from on public.connections (from_id, created_at desc);

-- RLS on, no policies: invisible to clients except through the functions below.
alter table public.connections enable row level security;

-- helpers
create or replace function public.is_member(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = p_id and status = 'approved')
$$;

create or replace function public.connect_setting(p_key text, p_fallback int) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from app_settings where key = p_key), p_fallback)
$$;

-- pending requests past their expiry become 'expired'
create or replace function public.expire_connections(p_a uuid, p_b uuid) returns void
language sql security definer set search_path = public as $$
  update connections set status = 'expired', decided_at = coalesce(decided_at, now())
   where status = 'pending'
     and created_at < now() - make_interval(days => connect_setting('connect_expiry_days', 14))
     and ((from_id = p_a and to_id = p_b) or (from_id = p_b and to_id = p_a))
$$;

create or replace function public.withdraw_connect(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  update connections set status = 'withdrawn', decided_at = now()
   where id = p_id and from_id = auth.uid() and status = 'pending';
  return jsonb_build_object('ok', found);
end $$;

create or replace function public.remove_connect(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  update connections set status = 'removed', decided_at = now()
   where id = p_id and auth.uid() in (from_id, to_id) and status = 'accepted';
  if found then delete from messages where connection_id = p_id; end if;
  return jsonb_build_object('ok', found);
end $$;

create or replace function public.mark_connections_seen() returns void
language sql security definer set search_path = public as $$
  update connections set to_seen_at = now()
   where to_id = auth.uid() and status = 'pending' and to_seen_at is null;
  update connections set from_seen_at = now()
   where from_id = auth.uid() and status = 'accepted' and from_seen_at is null;
$$;

revoke execute on function
  public.withdraw_connect(uuid), public.remove_connect(uuid), public.mark_connections_seen(),
  public.expire_connections(uuid, uuid)
from anon, public;
grant execute on function public.withdraw_connect(uuid), public.remove_connect(uuid), public.mark_connections_seen() to authenticated;

revoke execute on function public.expire_connections(uuid, uuid) from authenticated;

-- ===========================================================================
-- CHAT
-- A match opens a 1:1 chat. Only matched members can write; unmatch or block deletes the thread for both;
-- admins never read threads, only what someone reported.
-- ===========================================================================

-- email preference
create table if not exists public.member_settings (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  -- email me about connect requests, matches and unread messages
  emails      boolean not null default true,
  updated_at  timestamptz not null default now()
);

alter table public.member_settings enable row level security;

create policy "own settings: read" on public.member_settings for select using (auth.uid() = user_id);

create policy "own settings: insert" on public.member_settings for insert with check (auth.uid() = user_id);

create policy "own settings: update" on public.member_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger member_settings_touch before update on public.member_settings
  for each row execute function public.touch_profile();

create table if not exists public.messages (
  id             uuid primary key default gen_random_uuid(),
  connection_id  uuid not null references public.connections (id) on delete cascade,
  sender_id      uuid not null references public.profiles (id) on delete cascade,
  body           text not null check (char_length(body) between 1 and 500),
  created_at     timestamptz not null default now()
);

create index if not exists messages_thread on public.messages (connection_id, created_at desc);

create index if not exists messages_sender on public.messages (sender_id, created_at desc);

-- RLS on, no policies: read and written only through the functions below.
alter table public.messages enable row level security;

-- blocks and reports
create table if not exists public.blocks (
  blocker_id  uuid not null references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create table if not exists public.reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid references public.profiles (id) on delete set null,
  reported_id    uuid references public.profiles (id) on delete set null,
  -- what the reporter saw, copied before the thread is deleted: the request + the last messages
  snapshot       jsonb not null,
  reason         text check (char_length(reason) <= 500),
  status         text not null default 'open' check (status in ('open', 'resolved', 'hidden')),
  resolved_by    uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz
);

create index if not exists reports_open on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create policy "admins read reports" on public.reports for select using (public.is_admin());

-- helpers
create or replace function public.is_blocked(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker_id = p_a and blocked_id = p_b) or (blocker_id = p_b and blocked_id = p_a))
$$;

-- the accepted connection p_conn, if the caller is in it and the other person is still a member
create or replace function public.my_thread(p_conn uuid) returns connections
language sql stable security definer set search_path = public as $$
  select c.* from connections c
   where c.id = p_conn and c.status = 'accepted' and auth.uid() in (c.from_id, c.to_id)
     and is_member(case when c.from_id = auth.uid() then c.to_id else c.from_id end)
$$;

-- connect: blocks respected (a block reads as "not found")
create or replace function public.send_connect_v2(p_to uuid, p_intent text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  r connections;
  v_note text := left(nullif(btrim(coalesce(p_note, '')), ''), 200);
begin
  if me is null then return jsonb_build_object('ok', false, 'state', 'signed_out'); end if;
  if not is_member(me) then return jsonb_build_object('ok', false, 'state', 'not_member'); end if;
  if p_to = me then return jsonb_build_object('ok', false, 'state', 'self'); end if;
  if not is_member(p_to) or is_blocked(me, p_to) then return jsonb_build_object('ok', false, 'state', 'not_found'); end if;
  if p_intent not in ('coffee', 'work', 'ideas', 'build', 'hangout') then
    return jsonb_build_object('ok', false, 'state', 'invalid');
  end if;

  perform expire_connections(me, p_to);

  select * into r from connections
   where status in ('pending', 'accepted')
     and ((from_id = me and to_id = p_to) or (from_id = p_to and to_id = me))
   limit 1;

  if found and r.status = 'accepted' then
    return jsonb_build_object('ok', false, 'state', 'connected', 'id', r.id);
  end if;
  if found and r.from_id = me then
    return jsonb_build_object('ok', false, 'state', 'already_sent', 'id', r.id);
  end if;
  if found then
    -- they already asked you: that's a match (your note isn't needed any more)
    update connections set status = 'accepted', decided_at = now(), to_seen_at = coalesce(to_seen_at, now())
     where id = r.id;
    return jsonb_build_object('ok', true, 'state', 'matched', 'id', r.id, 'intent', r.intent, 'other', p_to);
  end if;

  if exists (
    select 1 from connections
     where from_id = me and to_id = p_to
       and status in ('declined', 'expired', 'withdrawn')
       and created_at > now() - make_interval(days => connect_setting('connect_cooldown_days', 30))
  ) then
    return jsonb_build_object('ok', false, 'state', 'cooldown');
  end if;

  if (select count(*) from connections where from_id = me and created_at > now() - interval '1 day')
     >= connect_setting('connect_daily_limit', 10) then
    return jsonb_build_object('ok', false, 'state', 'limit');
  end if;

  insert into connections (from_id, to_id, intent, note) values (me, p_to, p_intent, v_note) returning * into r;
  return jsonb_build_object('ok', true, 'state', 'sent', 'id', r.id, 'intent', r.intent, 'other', p_to, 'note', r.note);
end $$;

create or replace function public.respond_connect_v2(p_id uuid, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  r connections;
begin
  if me is null then return jsonb_build_object('ok', false, 'state', 'signed_out'); end if;
  select * into r from connections where id = p_id and to_id = me;
  if not found then return jsonb_build_object('ok', false, 'state', 'not_found'); end if;
  perform expire_connections(r.from_id, r.to_id);
  select * into r from connections where id = p_id;
  if r.status <> 'pending' then return jsonb_build_object('ok', false, 'state', r.status); end if;
  if p_accept and (not is_member(r.from_id) or is_blocked(me, r.from_id)) then
    return jsonb_build_object('ok', false, 'state', 'not_found');
  end if;

  update connections
     set status = case when p_accept then 'accepted' else 'declined' end,
         decided_at = now(),
         to_seen_at = coalesce(to_seen_at, now())
   where id = p_id;
  return jsonb_build_object('ok', true, 'state', case when p_accept then 'matched' else 'declined' end,
                            'id', p_id, 'intent', r.intent, 'other', r.from_id);
end $$;

-- Everything you see about your connections: requests, matches (with unread + last message), sent.
create or replace function public.my_connections_v2() returns jsonb
language sql stable security definer set search_path = public as $$
  with mine as (
    select c.*,
           case when c.from_id = auth.uid() then 'out' else 'in' end as dir,
           case when c.from_id = auth.uid() then c.to_id else c.from_id end as other_id,
           case when c.from_id = auth.uid() then c.from_read_at else c.to_read_at end as my_read_at,
           c.created_at < now() - make_interval(days => connect_setting('connect_expiry_days', 14)) as stale
      from connections c
     where auth.uid() in (c.from_id, c.to_id)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', m.id,
           'dir', m.dir,
           'intent', m.intent,
           'note', m.note,
           'state', case when m.status = 'accepted' then 'matched' else 'pending' end,
           'created_at', m.created_at,
           'decided_at', case when m.status = 'accepted' then m.decided_at end,
           'seen', case when m.status = 'accepted' and m.dir = 'out' then m.from_seen_at is not null
                        when m.dir = 'in' then m.to_seen_at is not null
                        else true end,
           'other', jsonb_build_object('id', p.id, 'name', p.name, 'role', p.role, 'character', p.character, 'location', p.location),
           'last_message_at', m.last_message_at,
           'unread', case when m.status = 'accepted' then
                       (select count(*) from messages x
                         where x.connection_id = m.id and x.sender_id <> auth.uid()
                           and x.created_at > coalesce(m.my_read_at, '-infinity'::timestamptz))
                     else 0 end,
           'last', case when m.status = 'accepted' then
                     (select jsonb_build_object('body', left(x.body, 120), 'mine', x.sender_id = auth.uid(), 'at', x.created_at)
                        from messages x where x.connection_id = m.id order by x.created_at desc limit 1) end
         ) order by coalesce(m.last_message_at, m.decided_at, m.created_at) desc), '[]'::jsonb)
    from mine m
    join profiles p on p.id = m.other_id and p.status = 'approved'
   where not is_blocked(auth.uid(), m.other_id)
     and (m.status = 'accepted'
      -- open requests; a decline looks exactly like silence to the sender
      or (m.status = 'pending' and not m.stale)
      or (m.status = 'declined' and m.dir = 'out' and not m.stale))
$$;

-- messages
create or replace function public.send_message(p_conn uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  c connections;
  v_body text := btrim(coalesce(p_body, ''));
  m messages;
begin
  if me is null then return jsonb_build_object('ok', false, 'state', 'signed_out'); end if;
  if not is_member(me) then return jsonb_build_object('ok', false, 'state', 'not_member'); end if;
  c := my_thread(p_conn);
  if c.id is null or is_blocked(c.from_id, c.to_id) then return jsonb_build_object('ok', false, 'state', 'not_found'); end if;
  if char_length(v_body) = 0 then return jsonb_build_object('ok', false, 'state', 'empty'); end if;
  if char_length(v_body) > 500 then return jsonb_build_object('ok', false, 'state', 'too_long'); end if;
  if (select count(*) from messages where sender_id = me and created_at > now() - interval '1 minute') >= 30 then
    return jsonb_build_object('ok', false, 'state', 'slow_down');
  end if;

  insert into messages (connection_id, sender_id, body) values (c.id, me, v_body) returning * into m;
  update connections
     set last_message_at = m.created_at,
         from_read_at = case when from_id = me then m.created_at else from_read_at end,
         to_read_at   = case when to_id = me then m.created_at else to_read_at end
   where id = c.id;
  return jsonb_build_object('ok', true, 'state', 'sent', 'message',
    jsonb_build_object('id', m.id, 'connection_id', m.connection_id, 'sender_id', m.sender_id, 'body', m.body, 'created_at', m.created_at));
end $$;

-- the newest p_limit messages before p_before (oldest first), for one of your threads
create or replace function public.thread_messages(p_conn uuid, p_before timestamptz default null, p_limit int default 50) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'connection_id', x.connection_id, 'sender_id', x.sender_id,
                                               'body', x.body, 'created_at', x.created_at) order by x.created_at), '[]'::jsonb)
    from (select * from messages
           where connection_id = (my_thread(p_conn)).id
             and created_at < coalesce(p_before, 'infinity'::timestamptz)
           order by created_at desc
           limit least(greatest(coalesce(p_limit, 50), 1), 100)) x
$$;

create or replace function public.mark_read(p_conn uuid) returns void
language sql security definer set search_path = public as $$
  update connections
     set from_read_at = case when from_id = auth.uid() then now() else from_read_at end,
         to_read_at   = case when to_id = auth.uid() then now() else to_read_at end
   where id = p_conn and status = 'accepted' and auth.uid() in (from_id, to_id)
$$;

-- block, report, admin

-- Ends anything open between you, deletes the thread for both, and stops either asking again.
create or replace function public.block_member(p_other uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null or p_other is null or p_other = me then return jsonb_build_object('ok', false); end if;
  insert into blocks (blocker_id, blocked_id) values (me, p_other) on conflict do nothing;
  delete from messages where connection_id in (
    select id from connections where (from_id = me and to_id = p_other) or (from_id = p_other and to_id = me));
  update connections set status = 'removed', decided_at = now()
   where status in ('pending', 'accepted')
     and ((from_id = me and to_id = p_other) or (from_id = p_other and to_id = me));
  return jsonb_build_object('ok', true);
end $$;

-- Copies what you saw (the request + the last 20 messages) for the admins, then blocks them.
create or replace function public.report_member(p_conn uuid, p_reason text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  c connections;
  v_other uuid;
begin
  select * into c from connections where id = p_conn and me in (from_id, to_id);
  if not found then return jsonb_build_object('ok', false, 'state', 'not_found'); end if;
  v_other := case when c.from_id = me then c.to_id else c.from_id end;
  insert into reports (reporter_id, reported_id, reason, snapshot) values (
    me, v_other, left(nullif(btrim(coalesce(p_reason, '')), ''), 500),
    jsonb_build_object(
      'connection', jsonb_build_object('id', c.id, 'from_id', c.from_id, 'to_id', c.to_id, 'intent', c.intent,
                                       'note', c.note, 'status', c.status, 'created_at', c.created_at),
      'reported', (select jsonb_build_object('id', p.id, 'name', p.name, 'role', p.role) from profiles p where p.id = v_other),
      'messages', (select coalesce(jsonb_agg(jsonb_build_object('from', x.sender_id, 'body', x.body, 'at', x.created_at) order by x.created_at), '[]'::jsonb)
                     from (select * from messages where connection_id = c.id order by created_at desc limit 20) x)));
  perform block_member(v_other);
  return jsonb_build_object('ok', true);
end $$;

-- Admins: close a report; with p_hide the reported member leaves the city (profiles.status = hidden).
create or replace function public.admin_resolve_report(p_id uuid, p_hide boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r reports;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  update reports set status = case when p_hide then 'hidden' else 'resolved' end,
                     resolved_by = auth.uid(), resolved_at = now()
   where id = p_id returning * into r;
  if not found then return jsonb_build_object('ok', false); end if;
  if p_hide and r.reported_id is not null then
    update profiles set status = 'hidden' where id = r.reported_id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- unread-message emails (called by the server with the service key, from /api/cron/chat-digest)

-- Each person with messages unread for at least p_min_age in a thread, not emailed about that thread
-- within p_gap: who to email, from whom, how many.
create or replace function public.chat_digest_due(p_min_age interval default '10 minutes', p_gap interval default '6 hours')
returns table (connection_id uuid, recipient_id uuid, sender_id uuid, sender_name text, unread int)
language sql stable security definer set search_path = public as $$
  select c.id, side.recipient, side.sender, p.name, u.unread::int
    from connections c
    cross join lateral (
      values (c.to_id, c.from_id, c.to_read_at, c.to_emailed_at), (c.from_id, c.to_id, c.from_read_at, c.from_emailed_at)
    ) as side (recipient, sender, read_at, emailed_at)
    cross join lateral (
      select count(*) as unread, min(x.created_at) as first_at, max(x.created_at) as last_at
        from messages x
       where x.connection_id = c.id and x.sender_id = side.sender
         and x.created_at > coalesce(side.read_at, '-infinity'::timestamptz)
    ) u
    join profiles p on p.id = side.sender and p.status = 'approved'
   where c.status = 'accepted'
     and c.last_message_at > now() - interval '7 days'
     and u.unread > 0
     and u.first_at < now() - p_min_age
     -- something new since the last email, and not more than once per p_gap
     and (side.emailed_at is null or (u.last_at > side.emailed_at and side.emailed_at < now() - p_gap))
     and coalesce((select ms.emails from member_settings ms where ms.user_id = side.recipient), true)
     and is_member(side.recipient)
   limit 200
$$;

create or replace function public.chat_mark_emailed(p_conn uuid, p_recipient uuid) returns void
language sql security definer set search_path = public as $$
  update connections
     set from_emailed_at = case when from_id = p_recipient then now() else from_emailed_at end,
         to_emailed_at   = case when to_id = p_recipient then now() else to_emailed_at end
   where id = p_conn
$$;

create policy "members hear their own topic" on realtime.messages for select to authenticated
  using (realtime.topic() = 'user:' || auth.uid()::text);

-- never let a realtime hiccup fail the write that triggered it
create or replace function public.notify_user(p_user uuid, p_event text, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform realtime.send(p_payload, p_event, 'user:' || p_user::text, true);
exception when others then
  raise warning 'notify_user failed: %', sqlerrm;
end $$;

create or replace function public.messages_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c connections;
  v jsonb := jsonb_build_object('id', new.id, 'connection_id', new.connection_id, 'sender_id', new.sender_id,
                                'body', new.body, 'created_at', new.created_at);
begin
  select * into c from connections where id = new.connection_id;
  perform notify_user(c.from_id, 'message', v);
  perform notify_user(c.to_id, 'message', v);
  return null;
end $$;

create trigger messages_notify after insert on public.messages
  for each row execute function public.messages_notify();

-- requests, matches, unmatches: just "look again" (the list itself comes from my_connections_v2)
create or replace function public.connections_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform notify_user(new.to_id, 'connections', jsonb_build_object('id', new.id));
  elsif new.status is distinct from old.status then
    perform notify_user(new.from_id, 'connections', jsonb_build_object('id', new.id));
    perform notify_user(new.to_id, 'connections', jsonb_build_object('id', new.id));
  end if;
  return null;
end $$;

create trigger connections_notify after insert or update of status on public.connections
  for each row execute function public.connections_notify();

-- grants
revoke execute on function
  public.is_blocked(uuid, uuid), public.my_thread(uuid),
  public.send_connect_v2(uuid, text, text), public.respond_connect_v2(uuid, boolean),
  public.my_connections_v2(), public.send_message(uuid, text), public.thread_messages(uuid, timestamptz, int),
  public.mark_read(uuid), public.block_member(uuid), public.report_member(uuid, text),
  public.admin_resolve_report(uuid, boolean),
  public.chat_digest_due(interval, interval), public.chat_mark_emailed(uuid, uuid),
  public.notify_user(uuid, text, jsonb), public.messages_notify(), public.connections_notify()
from anon, authenticated, public;

grant execute on function
  public.send_connect_v2(uuid, text, text), public.respond_connect_v2(uuid, boolean),
  public.my_connections_v2(), public.send_message(uuid, text), public.thread_messages(uuid, timestamptz, int),
  public.mark_read(uuid), public.block_member(uuid), public.report_member(uuid, text),
  public.admin_resolve_report(uuid, boolean)
to authenticated;

grant execute on function public.chat_digest_due(interval, interval), public.chat_mark_emailed(uuid, uuid) to service_role;

revoke all on public.blocks, public.messages from anon, authenticated;

revoke insert, update, delete on public.reports from anon, authenticated;

-- ===========================================================================
-- SCHEDULED JOBS
-- The database calls the website on a schedule (pg_cron + pg_net), with the same CRON_SECRET the
-- website has. Needs the two Vault secrets from the top of this file; without them the job runs and does nothing.
--   check:     select jobname, schedule, active from cron.job;
--   history:   select * from cron.job_run_details order by start_time desc limit 20;
--   responses: select id, status_code, left(content::text, 200) from net._http_response order by created desc limit 20;
-- ===========================================================================

create extension if not exists pg_cron;

create extension if not exists pg_net with schema extensions;

create or replace function public.call_cron(p_path text) returns bigint
language sql security definer set search_path = public as $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'site_url') || p_path,
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    timeout_milliseconds := 30000
  )
$$;

revoke execute on function public.call_cron(text) from anon, authenticated, public;

-- unread chat messages → one email (every 5 minutes)
select cron.schedule('chat-digest', '*/5 * * * *', $$ select public.call_cron('/api/cron/chat-digest') $$);

-- ===========================================================================
-- API GRANTS
-- Newer Supabase projects don't open tables to the API by default, so every grant is explicit.
-- Row-level security still decides which rows each person sees.
-- ===========================================================================

grant usage on schema public to anon, authenticated, service_role;

-- the server (service role key) does everything RLS doesn't let members do
grant all on all tables in schema public to service_role;

grant all on all sequences in schema public to service_role;

grant execute on all functions in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;

alter default privileges in schema public grant all on sequences to service_role;

alter default privileges in schema public grant execute on functions to service_role;

-- read: everyone sees approved profiles and the settings; members see their own rows (RLS)
grant select on public.profiles, public.app_settings to anon, authenticated;

grant select on public.invites, public.applications, public.member_settings, public.reports to authenticated;

-- write: your own profile (insert pending, delete; update is per column, see PROFILES) and email setting
grant insert, delete on public.profiles to authenticated;

grant insert, update on public.member_settings to authenticated;
