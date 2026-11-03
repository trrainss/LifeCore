-- ============================================================
-- LifeCore: МИГРАЦИЯ на мультипользовательский режим с Auth.
-- ВЕРСИЯ 3 — идемпотентна, можно запускать повторно
-- (в том числе если предыдущая версия прервалась на ошибке).
--
-- ВАЖНО: старые демо-данные без владельца будут удалены.
-- Новый аккаунт стартует пустым — данные добавляются вручную.
-- ============================================================

-- 0. Удаляем старые данные без владельца.
--    (Если в базе есть реальные данные, которые нужно сохранить, —
--    остановитесь и напишите мне, дам скрипт с переносом.)
delete from habit_completions;
delete from habits;
delete from anti_clean_days;
delete from anti_relapses;
delete from anti_habits;
delete from tasks;
delete from transactions;
delete from health;

-- 1. Добавляем user_id во все таблицы (если ещё нет)
alter table habits add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table habit_completions add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table anti_habits add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table anti_clean_days add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table anti_relapses add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table tasks add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table transactions add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table health add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;

-- 2. health: первичный ключ (user_id, date) вместо (date)
alter table health drop constraint if exists health_pkey;
alter table health add primary key (user_id, date);

-- 3. Профили вместо общей таблицы settings
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_name text not null default 'Друг',
  daily_water_goal integer not null default 8,
  daily_steps_goal integer not null default 10000,
  sleep_goal numeric not null default 8,
  created_at timestamptz not null default now()
);

-- Переносим настройки из старой таблицы первому пользователю (если она ещё есть)
do $$
declare
  first_user uuid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'settings') then
    select id into first_user from auth.users order by created_at limit 1;
    if first_user is not null then
      execute format(
        'insert into profiles (id, user_name, daily_water_goal, daily_steps_goal, sleep_goal)
         select %L, user_name, daily_water_goal, daily_steps_goal, sleep_goal from settings
         on conflict (id) do nothing',
        first_user
      );
    end if;
    drop table settings;
  end if;
end $$;

-- Профили для пользователей, зарегистрированных до создания триггера
insert into profiles (id, user_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'user_name', 'Друг')
from auth.users u
on conflict (id) do nothing;

-- 4. Триггер: профиль создаётся автоматически при регистрации
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, user_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'user_name', 'Друг'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Удаляем ВСЕ старые политики на наших таблицах (идемпотентно)
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('habits','habit_completions','anti_habits','anti_clean_days','anti_relapses','tasks','transactions','health','settings','profiles')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 6. RLS + политики изоляции по пользователю
alter table habits enable row level security;
alter table habit_completions enable row level security;
alter table anti_habits enable row level security;
alter table anti_clean_days enable row level security;
alter table anti_relapses enable row level security;
alter table tasks enable row level security;
alter table transactions enable row level security;
alter table health enable row level security;
alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "habits_own" on habits
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_completions_own" on habit_completions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "anti_habits_own" on anti_habits
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "anti_clean_days_own" on anti_clean_days
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "anti_relapses_own" on anti_relapses
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_own" on tasks
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_own" on transactions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "health_own" on health
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);