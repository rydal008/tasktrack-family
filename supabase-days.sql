-- TaskTrack Family — per-task day choice
-- Safe to run more than once.
-- Monday = 0 ... Sunday = 6

alter table tasks add column if not exists days smallint[];

-- Fill in from the old fixed frequency labels, once.
update tasks
   set days = case frequency
                when 'daily' then '{0,1,2,3,4,5,6}'::smallint[]
                when '5x'    then '{0,1,2,3,4}'::smallint[]
                when '3x'    then '{0,2,4}'::smallint[]
                when '2x'    then '{1,3}'::smallint[]
                else              '{0,1,2,3,4,5,6}'::smallint[]
              end
 where days is null;

alter table tasks alter column days set default '{0,1,2,3,4,5,6}';
alter table tasks alter column days set not null;

alter table tasks drop constraint if exists tasks_days_valid;
alter table tasks add constraint tasks_days_valid
  check (array_length(days, 1) between 1 and 7 and days <@ '{0,1,2,3,4,5,6}'::smallint[]);

-- 'frequency' is now decorative. Left in place and made optional so a browser
-- still running the old build keeps working until it picks up the new one.
alter table tasks alter column frequency drop not null;
alter table tasks alter column frequency set default 'daily';
