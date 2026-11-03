-- ============================================================
-- LifeCore: схема для Supabase (Postgres)
-- Выполните этот скрипт в SQL Editor вашего проекта Supabase.
-- ============================================================

-- ---------- Таблицы ----------

create table if not exists habits (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'spark',
  color text not null default '#4DA3FF',
  target_per_week integer not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists habit_completions (
  habit_id text not null references habits(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  primary key (habit_id, date)
);

create table if not exists anti_habits (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'shield',
  color text not null default '#FF5D73',
  record integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists anti_clean_days (
  anti_id text not null references anti_habits(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  primary key (anti_id, date)
);

create table if not exists anti_relapses (
  anti_id text not null references anti_habits(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  primary key (anti_id, date)
);

create table if not exists tasks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  priority text not null default 'medium',
  due date not null,
  done boolean not null default false,
  estimate_min integer not null default 30,
  spent_min integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  category text not null,
  date date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists health (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  sleep_hours numeric not null,
  water_glasses integer not null,
  steps integer not null,
  mood integer not null check (mood between 1 and 5),
  primary key (user_id, date)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_name text not null default 'Друг',
  daily_water_goal integer not null default 8,
  daily_steps_goal integer not null default 10000,
  sleep_goal numeric not null default 8,
  created_at timestamptz not null default now()
);

-- ---------- Триггер: профиль создаётся автоматически при регистрации ----------

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

-- ---------- Безопасность ----------
-- Каждый пользователь видит и меняет только свои данные.

alter table habits enable row level security;
alter table habit_completions enable row level security;
alter table anti_habits enable row level security;
alter table anti_clean_days enable row level security;
alter table anti_relapses enable row level security;
alter table tasks enable row level security;
alter table transactions enable row level security;
alter table health enable row level security;
alter table profiles enable row level security;

-- Профиль: читать свой, создавать и обновлять свой
create policy "profiles_select_own" on profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Данные: полный доступ только к своим строкам
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
create policy "habit_completions_public" on habit_completions
  for all to anon, authenticated using (true) with check (true);
create policy "anti_habits_public" on anti_habits
  for all to anon, authenticated using (true) with check (true);
create policy "anti_clean_days_public" on anti_clean_days
  for all to anon, authenticated using (true) with check (true);
create policy "anti_relapses_public" on anti_relapses
  for all to anon, authenticated using (true) with check (true);
create policy "tasks_public" on tasks
  for all to anon, authenticated using (true) with check (true);
create policy "transactions_public" on transactions
  for all to anon, authenticated using (true) with check (true);
create policy "health_public" on health
  for all to anon, authenticated using (true) with check (true);
create policy "settings_public" on settings
  for all to anon, authenticated using (true) with check (true);
