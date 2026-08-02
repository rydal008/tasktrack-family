-- TaskTrack Family — let a chore skip photo evidence
-- Safe to run more than once.
-- Existing chores keep needing a photo, so nothing changes until you say so.

alter table tasks
  add column if not exists requires_evidence boolean not null default true;
