-- TaskTrack Family — evidence storage
-- Safe to run more than once.

-- Private bucket: photos of children must not be reachable by plain URL.
-- The app reads them back through short-lived signed links instead.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 52428800, array['image/*', 'video/*'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = 52428800,
      allowed_mime_types = array['image/*', 'video/*'];

drop policy if exists evidence_files on storage.objects;
create policy evidence_files on storage.objects
  for all to anon, authenticated
  using (bucket_id = 'evidence')
  with check (bucket_id = 'evidence');

-- One row per uploaded file, tied to the completion it proves.
create table if not exists evidence (
  id         uuid primary key default gen_random_uuid(),
  day        date not null,
  task_id    uuid not null,
  member_id  uuid not null,
  path       text not null,
  kind       text not null check (kind in ('photo', 'video')),
  created_at timestamptz not null default now(),
  foreign key (day, task_id, member_id)
    references completions (day, task_id, member_id) on delete cascade
);

create index if not exists evidence_cell_idx on evidence (day, task_id, member_id);

alter table evidence enable row level security;

drop policy if exists family_access on evidence;
create policy family_access on evidence
  for all to anon, authenticated
  using (true) with check (true);
