-- Add to your Supabase SQL Editor to enable Special Camp tracking

-- Special Camps table
create table if not exists special_camps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  start_date date not null,
  end_date date not null,
  description text,
  hours_value numeric not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Camp attendance (who attended which camp)
create table if not exists camp_attendance (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references special_camps(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  marked_by uuid references profiles(id),
  marked_at timestamptz not null default now(),
  unique (camp_id, user_id)
);

-- RLS
alter table special_camps enable row level security;
alter table camp_attendance enable row level security;

drop policy if exists "camps readable by authenticated" on special_camps;
create policy "camps readable by authenticated"
  on special_camps for select to authenticated using (true);

drop policy if exists "only official can manage camps" on special_camps;
create policy "only official can manage camps"
  on special_camps for all to authenticated
  using (is_official(auth.uid()))
  with check (is_official(auth.uid()));

drop policy if exists "camp attendance readable by authenticated" on camp_attendance;
create policy "camp attendance readable by authenticated"
  on camp_attendance for select to authenticated using (true);

drop policy if exists "only official can mark camp attendance" on camp_attendance;
create policy "only official can mark camp attendance"
  on camp_attendance for all to authenticated
  using (is_official(auth.uid()))
  with check (is_official(auth.uid()));