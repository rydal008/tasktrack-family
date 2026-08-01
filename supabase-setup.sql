-- TaskTrack Family — database setup
-- Safe to run more than once.

create table if not exists members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 3),
  avatar     text not null default 'avatar-1',
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 10),
  points     numeric not null default 1 check (points > 0),
  frequency  text not null default 'daily' check (frequency in ('daily', '5x', '3x', '2x')),
  created_at timestamptz not null default now()
);

-- Which members a task is assigned to.
create table if not exists task_members (
  task_id   uuid not null references tasks(id)   on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  primary key (task_id, member_id)
);

-- One row per person, per task, per day.
create table if not exists completions (
  day        date not null,
  task_id    uuid not null references tasks(id)   on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  status     text not null default 'incomplete'
             check (status in ('incomplete', 'completed', 'pending', 'approved')),
  updated_at timestamptz not null default now(),
  primary key (day, task_id, member_id)
);

create index if not exists completions_day_idx on completions (day);

-- The app has no login, so the shared publishable key needs read/write access.
alter table members      enable row level security;
alter table tasks        enable row level security;
alter table task_members enable row level security;
alter table completions  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['members', 'tasks', 'task_members', 'completions'] loop
    execute format('drop policy if exists family_access on %I', t);
    execute format(
      'create policy family_access on %I for all to anon, authenticated using (true) with check (true)', t
    );
  end loop;
end $$;

-- Let every device see changes live.
do $$
declare t text;
begin
  foreach t in array array['members', 'tasks', 'task_members', 'completions'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
