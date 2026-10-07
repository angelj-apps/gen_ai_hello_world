-- Quick fix if Generate works but saving fails.
-- Run in SQL editor if you have not already run supabase/hw4.sql.

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  spot_id uuid references public.spots (id) on delete set null,
  prompt text not null,
  system_prompt text not null,
  caption text not null,
  score integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.generations enable row level security;

drop policy if exists "Authenticated can read generations" on public.generations;
drop policy if exists "Users insert own generations" on public.generations;

create policy "Authenticated can read generations"
  on public.generations for select
  to authenticated
  using (true);

create policy "Users insert own generations"
  on public.generations for insert
  to authenticated
  with check (user_id = auth.uid());

grant select, insert on table public.generations to authenticated;
