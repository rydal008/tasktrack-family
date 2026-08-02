-- TaskTrack Family — shared app title
-- Safe to run more than once.
--
-- app_settings has row level security with no policy, so the app cannot touch
-- it directly. These two functions are the only way in, and they only ever see
-- the title — never the PIN hash sitting in the same row.

create or replace function get_app_title()
returns text
language sql
security definer
set search_path = public
as $$
  select title from app_settings where id = 1;
$$;

create or replace function set_app_title(new_title text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(coalesce(new_title, '')) > 40 then
    return false;
  end if;

  update app_settings
     set title      = nullif(btrim(coalesce(new_title, '')), ''),
         updated_at = now()
   where id = 1;

  return true;
end;
$$;

grant execute on function get_app_title()      to anon, authenticated;
grant execute on function set_app_title(text)  to anon, authenticated;
