-- Profiles table + trigger for new auth.users rows.
-- Run this in the Supabase SQL editor (same project as HW2).
-- Assignment note: RLS can stay off for now.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  avatar_url text,
  favorite_drink text,
  updated_at timestamptz not null default now()
);

-- Keep RLS off for this assignment (per brief). Uncomment later if needed.
alter table public.profiles disable row level security;

-- Auto-create a profile row when a user signs up / signs in for the first time.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'given_name',
    new.raw_user_meta_data ->> 'family_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for profile photos (store URL in profiles.avatar_url — never binary in the table).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Open storage policies for this assignment (tighten later with RLS).
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Anyone can upload an avatar" on storage.objects;
drop policy if exists "Anyone can update an avatar" on storage.objects;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars');

create policy "Anyone can update an avatar"
  on storage.objects for update
  using (bucket_id = 'avatars');
