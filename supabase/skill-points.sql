-- Skillpoints on learned concepts (practice rewards).

alter table public.learned_concepts
  add column if not exists skill_points integer not null default 0;

-- Allow learners to update their own skill_points after practice.
drop policy if exists "Users update own learned concepts" on public.learned_concepts;
drop policy if exists "Users delete own learned concepts" on public.learned_concepts;

create policy "Users update own learned concepts"
  on public.learned_concepts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own learned concepts"
  on public.learned_concepts for delete
  to authenticated
  using (user_id = auth.uid());

grant update, delete on table public.learned_concepts to authenticated;
