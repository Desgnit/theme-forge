-- Client PB Tracker — Supabase schema.
--
-- Paste this whole file into your project's SQL editor (Dashboard → SQL →
-- New query → Run). Safe to run again after edits: everything is created
-- with "if not exists" or replaced.
--
-- The design in one paragraph: every entry row belongs to one signed-in
-- user, and row-level security means the browser's public anon key can only
-- ever reach rows the JSON Web Token says are yours. A coach sees an
-- athlete's rows read-only, and only after redeeming an invite code the
-- athlete minted. Writes carry the writing device's `updated` stamp and the
-- trigger below keeps whichever write is newest, so two phones can sync in
-- any order without a stale one clobbering a fresh one.

-- ---------------------------------------------------------------- tables

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  updated timestamptz not null default now()
);

create table if not exists public.entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session text not null default '',
  metric text not null,
  value double precision not null check (value > 0),
  date date not null,
  note text not null default '',
  updated timestamptz not null,                       -- writing device's clock: last write wins
  deleted boolean not null default false,             -- tombstone, so deletes sync too
  server_updated timestamptz not null default now()   -- server clock: the pull watermark
);

create index if not exists entries_pull_idx on public.entries (user_id, server_updated);

create table if not exists public.coach_links (
  coach_id uuid not null references auth.users (id) on delete cascade,
  athlete_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (coach_id, athlete_id)
);

create table if not exists public.coach_invites (
  code text primary key,
  athlete_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  -- set null, not cascade or restrict: a redeemed invite is history worth
  -- keeping, and a stale one must never block deleting a user
  used_by uuid references auth.users (id) on delete set null
);

-- ------------------------------------------------- last-write-wins trigger

create or replace function public.entries_lww ()
  returns trigger
  language plpgsql
  as $$
begin
  if tg_op = 'UPDATE' and new.updated <= old.updated then
    return null; -- a stale device pushed an old version: keep what we have
  end if;
  new.server_updated := now();
  return new;
end;
$$;

drop trigger if exists entries_lww on public.entries;

create trigger entries_lww
  before insert or update on public.entries
  for each row
  execute function public.entries_lww ();

-- ------------------------------------------------------ row-level security

alter table public.profiles enable row level security;

alter table public.entries enable row level security;

alter table public.coach_links enable row level security;

alter table public.coach_invites enable row level security;

-- entries: yours to do anything with, a linked coach's to read
drop policy if exists entries_own on public.entries;

create policy entries_own on public.entries
  for all
    using (user_id = auth.uid ())
    with check (user_id = auth.uid ());

drop policy if exists entries_coach_read on public.entries;

create policy entries_coach_read on public.entries
  for select
    using (exists (
      select 1 from public.coach_links cl
      where cl.athlete_id = entries.user_id and cl.coach_id = auth.uid ()));

-- profiles: yours to edit; visible to your coach and to your athletes
drop policy if exists profiles_own on public.profiles;

create policy profiles_own on public.profiles
  for all
    using (id = auth.uid ())
    with check (id = auth.uid ());

drop policy if exists profiles_linked_read on public.profiles;

create policy profiles_linked_read on public.profiles
  for select
    using (exists (
      select 1 from public.coach_links cl
      where (cl.athlete_id = profiles.id and cl.coach_id = auth.uid ())
         or (cl.coach_id = profiles.id and cl.athlete_id = auth.uid ())));

-- coach_links: the athlete owns the link; the coach can see it and walk away
drop policy if exists coach_links_athlete on public.coach_links;

create policy coach_links_athlete on public.coach_links
  for all
    using (athlete_id = auth.uid ())
    with check (athlete_id = auth.uid ());

drop policy if exists coach_links_coach_read on public.coach_links;

create policy coach_links_coach_read on public.coach_links
  for select
    using (coach_id = auth.uid ());

drop policy if exists coach_links_coach_leave on public.coach_links;

create policy coach_links_coach_leave on public.coach_links
  for delete
    using (coach_id = auth.uid ());

-- coach_invites: only the athlete touches their own invites directly;
-- redemption goes through the function below
drop policy if exists coach_invites_athlete on public.coach_invites;

create policy coach_invites_athlete on public.coach_invites
  for all
    using (athlete_id = auth.uid ())
    with check (athlete_id = auth.uid ());

-- -------------------------------------------------------- invite redemption

-- Runs with definer rights because the redeeming coach cannot read the
-- invite row under the policies above; the function checks everything the
-- policies would have.
create or replace function public.redeem_coach_invite (invite_code text)
  returns void
  language plpgsql
  security definer
  set search_path = public
  as $$
declare
  invite record;
begin
  select * into invite
  from coach_invites
  where code = upper(trim(invite_code)) and used_by is null and expires_at > now();
  if not found then
    raise exception 'That invite code is not valid any more.';
  end if;
  if invite.athlete_id = auth.uid () then
    raise exception 'That is your own invite code — send it to your coach.';
  end if;
  insert into coach_links (coach_id, athlete_id)
    values (auth.uid (), invite.athlete_id)
  on conflict do nothing;
  update coach_invites set used_by = auth.uid () where code = invite.code;
end;
$$;

revoke all on function public.redeem_coach_invite (text) from public;

grant execute on function public.redeem_coach_invite (text) to authenticated;
