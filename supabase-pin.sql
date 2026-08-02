-- TaskTrack Family — parent PIN
-- Safe to run more than once.

create extension if not exists pgcrypto with schema extensions;

create table if not exists app_settings (
  id         smallint primary key default 1 check (id = 1),
  pin_hash   text,
  title      text,
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

-- Row level security with no policy at all: the app can never read this
-- table directly, so the PIN hash never reaches a browser. The functions
-- below are the only way in, and they only ever answer yes or no.
alter table app_settings enable row level security;

create or replace function parent_pin_is_set()
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select pin_hash is not null from app_settings where id = 1;
$$;

create or replace function verify_parent_pin(pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  stored text;
begin
  select pin_hash into stored from app_settings where id = 1;
  if stored is null then
    return false;
  end if;
  return extensions.crypt(pin, stored) = stored;
end;
$$;

-- Setting the first PIN is open. Changing an existing one needs the old PIN.
create or replace function set_parent_pin(new_pin text, current_pin text default null)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  stored text;
begin
  if new_pin !~ '^[0-9]{4,6}$' then
    return false;
  end if;

  select pin_hash into stored from app_settings where id = 1;

  if stored is not null then
    if current_pin is null or extensions.crypt(current_pin, stored) <> stored then
      return false;
    end if;
  end if;

  update app_settings
     set pin_hash   = extensions.crypt(new_pin, extensions.gen_salt('bf')),
         updated_at = now()
   where id = 1;

  return true;
end;
$$;

grant execute on function parent_pin_is_set()            to anon, authenticated;
grant execute on function verify_parent_pin(text)        to anon, authenticated;
grant execute on function set_parent_pin(text, text)     to anon, authenticated;
