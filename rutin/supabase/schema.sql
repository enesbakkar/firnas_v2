-- Horizon Tracker: Supabase schema with Row Level Security.
-- Run in the Supabase SQL editor. Each signed-in user can only see and change their own rows;
-- the public (anon) key alone can no longer read or write anything.

-- =====================================================================
-- A) NEW PROJECT: create the table
-- =====================================================================
create table if not exists public.routines (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  date       text        not null check (date ~ '^\d{4}-\d{2}-\d{2}$'),
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- =====================================================================
-- B) EXISTING PROJECT: migrate the old table (date primary key, no user_id)
--    1. Create your user under Authentication > Users (email + password) if you have not.
--    2. Replace YOUR_EMAIL below, then run this block once.
-- =====================================================================
-- alter table public.routines add column if not exists user_id uuid references auth.users (id) on delete cascade;
-- update public.routines set user_id = (select id from auth.users where email = 'YOUR_EMAIL') where user_id is null;
-- alter table public.routines alter column user_id set not null;
-- alter table public.routines alter column user_id set default auth.uid();
-- alter table public.routines alter column updated_at set default now();
-- alter table public.routines drop constraint if exists routines_pkey;
-- alter table public.routines add primary key (user_id, date);

-- =====================================================================
-- C) BOTH: enable RLS and allow each user to touch only their own rows
-- =====================================================================
alter table public.routines enable row level security;
alter table public.routines force row level security;

revoke all on public.routines from anon;
grant select, insert, update, delete on public.routines to authenticated;

drop policy if exists "routines_select_own" on public.routines;
drop policy if exists "routines_insert_own" on public.routines;
drop policy if exists "routines_update_own" on public.routines;
drop policy if exists "routines_delete_own" on public.routines;

create policy "routines_select_own" on public.routines
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "routines_insert_own" on public.routines
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "routines_update_own" on public.routines
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "routines_delete_own" on public.routines
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Check: this should list only rls_enabled = true and the four policies above.
-- select relname, relrowsecurity as rls_enabled from pg_class where relname = 'routines';
-- select policyname, cmd from pg_policies where tablename = 'routines';
