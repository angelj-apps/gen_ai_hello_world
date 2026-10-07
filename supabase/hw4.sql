-- HW4: generations, votes, strict RLS, extra NYC weekend spots.
-- Run this in the gen_ai project's SQL editor.

-- Extra spots for the Columbia / new-to-NYC persona (not just coffee).
insert into public.spots (name, neighborhood, note)
select v.name, v.neighborhood, v.note
from (
  values
    ('Hungarian Pastry Shop', 'Morningside Heights', 'Laptop fog and poppy seed strudel across from campus.'),
    ('The Met Steps', 'Upper East Side', 'Weekend people-watching when the dorms feel too small.'),
    ('Smorgasburg', 'Williamsburg', 'Saturday food sprawl — go hungry, leave sticky.'),
    ('Westside Market', 'Morningside Heights', '2am snack run that counts as a personality.'),
    ('The 1 Train', 'Broadway Line', 'Doors closing, someone''s backpack in your ribs, somehow still late.'),
    ('Times Square', 'Midtown', 'Tourists, LED overload, and the sudden urge to never make eye contact.'),
    ('Grand Central Terminal', 'Midtown', 'Main concourse cosplay as a person with somewhere important to be.'),
    ('Round1 Bowling & Arcade', 'Flushing', 'Late-night claw machines, karaoke next door, dignity optional.'),
    ('Flushing Meadows Corona Park', 'Queens', 'Unisphere photos that never look as cool as you hoped.'),
    ('The High Line', 'Chelsea / Hudson Yards', 'Slow walkers, skyline peeks, and pretending this is exercise.'),
    ('Washington Square Park', 'Greenwich Village', 'Chess hustlers, street performers, and your friend who is Too Loud.'),
    ('The Strand', 'East Village / Union Square', '18 miles of books and zero decisions you can actually make.'),
    ('Coney Island Boardwalk', 'Brooklyn', 'Off-season wind, carnival ghosts, and a hot dog that feels earned.'),
    ('The G Train', 'Brooklyn / Queens', 'The mythical transfer. Pray, refresh Google Maps, accept your fate.')
) as v(name, neighborhood, note)
where not exists (
  select 1 from public.spots s where s.name = v.name
);

-- Profiles: enable RLS (was off in HW3).
alter table public.profiles enable row level security;

drop policy if exists "Authenticated can read profiles" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

create policy "Authenticated can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

grant select, insert, update on table public.profiles to authenticated;

-- Spots: signed-in read only, no client writes.
alter table public.spots enable row level security;
revoke all on table public.spots from anon, public;
grant select on table public.spots to authenticated;

-- Generations: AI captions + the prompts that produced them.
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

create index if not exists generations_score_idx
  on public.generations (score desc, created_at desc);

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

revoke all on table public.generations from anon, public;
grant select, insert on table public.generations to authenticated;

-- Votes: one row per user per caption. Clients may only touch their own rows.
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  generation_id uuid not null references public.generations (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (user_id, generation_id)
);

alter table public.votes enable row level security;

drop policy if exists "Users read own votes" on public.votes;
drop policy if exists "Users insert own votes" on public.votes;
drop policy if exists "Users update own votes" on public.votes;
drop policy if exists "Users delete own votes" on public.votes;

create policy "Users read own votes"
  on public.votes for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own votes"
  on public.votes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own votes"
  on public.votes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own votes"
  on public.votes for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.votes from anon, public;
grant select, insert, update, delete on table public.votes to authenticated;

-- Keep generations.score in sync without letting clients update the table.
create or replace function public.votes_adjust_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.generations
      set score = score + new.value
      where id = new.generation_id;
    return new;
  elsif tg_op = 'UPDATE' then
    update public.generations
      set score = score - old.value + new.value
      where id = new.generation_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.generations
      set score = score - old.value
      where id = old.generation_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists votes_adjust_score on public.votes;
create trigger votes_adjust_score
  after insert or update or delete on public.votes
  for each row execute procedure public.votes_adjust_score();

-- Tighten avatar storage: public read, write only into your own folder.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Anyone can upload an avatar" on storage.objects;
drop policy if exists "Anyone can update an avatar" on storage.objects;
drop policy if exists "Users can read avatars" on storage.objects;
drop policy if exists "Users upload own avatars" on storage.objects;
drop policy if exists "Users update own avatars" on storage.objects;

create policy "Users can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users upload own avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
