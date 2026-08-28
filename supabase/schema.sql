-- =========================================================
-- NSS Connect — Supabase Schema
-- Run this in your Supabase SQL Editor (Project > SQL Editor > New query)
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- PROFILES (volunteer & member profile information)
-- ---------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  department text,
  year int, -- Academic Year (1, 2, 3, 4)
  tenure_year int not null default 1 check (tenure_year in (1, 2)), -- NSS 2-Year Tenure (Year 1 or Year 2)
  status text not null default 'active' check (status in ('active', 'graduated', 'removed')),
  phone text,
  roll_number text,
  avatar_initials text,
  created_at timestamptz not null default now()
);

-- Ensure columns exist if updating existing table
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='tenure_year') then
    alter table profiles add column tenure_year int not null default 1 check (tenure_year in (1, 2));
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='status') then
    alter table profiles add column status text not null default 'active' check (status in ('active', 'graduated', 'removed'));
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='phone') then
    alter table profiles add column phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='roll_number') then
    alter table profiles add column roll_number text;
  end if;
end $$;

-- ---------------------------------------------------------
-- ROLES (role definitions: volunteer, core [heads], official [admin])
-- ---------------------------------------------------------
create table if not exists roles (
  user_id uuid primary key references profiles(id) on delete cascade,
  role text not null default 'volunteer' check (role in ('volunteer', 'core', 'official')),
  position text, -- E.g. 'General Secretary', 'Joint Secretary', 'Event Head', 'Media Head'
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- EVENTS (NSS unit events with capacity & FCFS registration)
-- ---------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text, -- E.g. 'Health & Blood Donation', 'Cleanliness & Swachhata', 'Education', 'Environment'
  event_date date not null,
  event_time text, -- E.g. '09:00 AM - 01:00 PM'
  location text not null,
  capacity int not null default 30,
  hours_value numeric not null default 0,
  status text not null default 'upcoming' check (status in ('upcoming', 'past', 'cancelled')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='events' and column_name='event_time') then
    alter table events add column event_time text;
  end if;
end $$;

-- ---------------------------------------------------------
-- REGISTRATIONS (One-way First-Come-First-Serve registration)
-- ---------------------------------------------------------
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------------------------------------------------------
-- ATTENDANCE (Marked by official; awards verified hours)
-- ---------------------------------------------------------
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  present boolean not null default false,
  hours_awarded numeric not null default 0,
  marked_by uuid references profiles(id),
  marked_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------------------------------------------------------
-- ACHIEVEMENTS (Unit awards, accolades & volunteer spotlights)
-- ---------------------------------------------------------
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'unit' check (category in ('unit', 'individual')),
  badge_icon text default 'trophy', -- trophy, star, medal, award, heart, zap
  user_id uuid references profiles(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  achieved_on date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- Helper Functions (Security Definer)
-- =========================================================
create or replace function is_official(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (select 1 from roles where user_id = uid and role = 'official');
$$;

create or replace function is_core(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (select 1 from roles where user_id = uid and role = 'core');
$$;

create or replace function is_core_or_official(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (select 1 from roles where user_id = uid and role in ('core', 'official'));
$$;

create or replace function total_hours(uid uuid)
returns numeric language sql stable security definer as $$
  select coalesce(sum(hours_awarded), 0) from attendance where user_id = uid and present = true;
$$;

-- Atomic FCFS Registration procedure with capacity check
create or replace function register_for_event(p_event_id uuid, p_user_id uuid)
returns json language plpgsql security definer as $$
declare
  v_capacity int;
  v_status text;
  v_registered_count int;
  v_user_status text;
  v_already_registered boolean;
begin
  -- Check user status
  select status into v_user_status from profiles where id = p_user_id;
  if v_user_status is distinct from 'active' then
    return json_build_object('success', false, 'error', 'Only active volunteers can register for events.');
  end if;

  -- Lock event row for atomic update
  select capacity, status into v_capacity, v_status from events where id = p_event_id for update;
  if not found then
    return json_build_object('success', false, 'error', 'Event not found.');
  end if;

  if v_status != 'upcoming' then
    return json_build_object('success', false, 'error', 'Registrations are closed for this event.');
  end if;

  -- Check if already registered
  select exists (select 1 from registrations where event_id = p_event_id and user_id = p_user_id) into v_already_registered;
  if v_already_registered then
    return json_build_object('success', false, 'error', 'You are already registered for this event.');
  end if;

  -- Count current registrations
  select count(*) into v_registered_count from registrations where event_id = p_event_id;
  if v_registered_count >= v_capacity then
    return json_build_object('success', false, 'error', 'This event has reached full capacity.');
  end if;

  -- Insert registration
  insert into registrations (event_id, user_id) values (p_event_id, p_user_id);
  return json_build_object('success', true, 'message', 'Registration confirmed successfully!');
end;
$$;

-- =========================================================
-- Auto-create profile + default role on signup
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(coalesce(new.email, 'volunteer'), '@', 1)
  );

  insert into public.profiles (id, full_name, tenure_year, status)
  values (
    new.id,
    v_name,
    1,
    'active'
  )
  on conflict (id) do update
  set full_name = coalesce(public.profiles.full_name, excluded.full_name);

  insert into public.roles (user_id, role)
  values (new.id, 'volunteer')
  on conflict (user_id) do nothing;

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =========================================================
-- Row Level Security (RLS)
-- =========================================================
alter table profiles enable row level security;
alter table roles enable row level security;
alter table events enable row level security;
alter table registrations enable row level security;
alter table attendance enable row level security;
alter table achievements enable row level security;

-- Profiles policies
drop policy if exists "profiles are readable by authenticated users" on profiles;
create policy "profiles are readable by authenticated users"
  on profiles for select to authenticated using (true);

drop policy if exists "users can update their own profile" on profiles;
create policy "users can update their own profile"
  on profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "official can update any profile" on profiles;
create policy "official can update any profile"
  on profiles for update to authenticated
  using (is_official(auth.uid()))
  with check (is_official(auth.uid()));

drop policy if exists "official can insert profile" on profiles;
create policy "official can insert profile"
  on profiles for insert to authenticated
  with check (is_official(auth.uid()) or auth.uid() = id);

-- Roles policies
drop policy if exists "roles are readable by authenticated users" on roles;
create policy "roles are readable by authenticated users"
  on roles for select to authenticated using (true);

drop policy if exists "only official can assign roles or positions" on roles;
create policy "only official can assign roles or positions"
  on roles for update to authenticated
  using (is_official(auth.uid()))
  with check (is_official(auth.uid()));

drop policy if exists "only official can insert roles" on roles;
create policy "only official can insert roles"
  on roles for insert to authenticated
  with check (is_official(auth.uid()));

-- Events policies
drop policy if exists "events are readable by authenticated users" on events;
create policy "events are readable by authenticated users"
  on events for select to authenticated using (true);

drop policy if exists "only official can create events" on events;
create policy "only official can create events"
  on events for insert to authenticated
  with check (is_official(auth.uid()));

drop policy if exists "only official can edit events" on events;
create policy "only official can edit events"
  on events for update to authenticated
  using (is_official(auth.uid()));

drop policy if exists "only official can delete events" on events;
create policy "only official can delete events"
  on events for delete to authenticated
  using (is_official(auth.uid()));

-- Registrations policies
drop policy if exists "users can view their own registrations" on registrations;
create policy "users can view their own registrations"
  on registrations for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "core and official can view all registrations" on registrations;
create policy "core and official can view all registrations"
  on registrations for select to authenticated
  using (is_core_or_official(auth.uid()));

drop policy if exists "active users can register themselves" on registrations;
create policy "active users can register themselves"
  on registrations for insert to authenticated
  with check (auth.uid() = user_id);

-- Attendance policies
drop policy if exists "users can view their own attendance" on attendance;
create policy "users can view their own attendance"
  on attendance for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "core and official can view all attendance" on attendance;
create policy "core and official can view all attendance"
  on attendance for select to authenticated
  using (is_core_or_official(auth.uid()));

drop policy if exists "only official can mark attendance" on attendance;
create policy "only official can mark attendance"
  on attendance for insert to authenticated
  with check (is_official(auth.uid()));

drop policy if exists "only official can update attendance" on attendance;
create policy "only official can update attendance"
  on attendance for update to authenticated
  using (is_official(auth.uid()));

-- Achievements policies
drop policy if exists "achievements are readable by authenticated users" on achievements;
create policy "achievements are readable by authenticated users"
  on achievements for select to authenticated using (true);

drop policy if exists "only official can add achievements" on achievements;
create policy "only official can add achievements"
  on achievements for insert to authenticated
  with check (is_official(auth.uid()));

drop policy if exists "only official can edit achievements" on achievements;
create policy "only official can edit achievements"
  on achievements for update to authenticated
  using (is_official(auth.uid()));

drop policy if exists "only official can delete achievements" on achievements;
create policy "only official can delete achievements"
  on achievements for delete to authenticated
  using (is_official(auth.uid()));
