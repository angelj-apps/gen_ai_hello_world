-- Concept progress for attempt-first learning.
-- Concept definitions live in src/lib/concepts.ts; this tracks what each user learned.

alter table public.tool_cards
  add column if not exists concept_id text;

alter table public.tool_cards
  add column if not exists learner_attempt text;

create table if not exists public.learned_concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  concept_id text not null,
  tool_card_id uuid references public.tool_cards (id) on delete set null,
  skill_points integer not null default 0,
  learned_at timestamptz not null default now(),
  unique (user_id, concept_id)
);

-- For DBs that created learned_concepts before skill_points existed.
alter table public.learned_concepts
  add column if not exists skill_points integer not null default 0;

create index if not exists learned_concepts_user_learned_at_idx
  on public.learned_concepts (user_id, learned_at desc);

alter table public.learned_concepts enable row level security;

drop policy if exists "Users read own learned concepts" on public.learned_concepts;
drop policy if exists "Users insert own learned concepts" on public.learned_concepts;
drop policy if exists "Users update own learned concepts" on public.learned_concepts;
drop policy if exists "Users delete own learned concepts" on public.learned_concepts;

create policy "Users read own learned concepts"
  on public.learned_concepts for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own learned concepts"
  on public.learned_concepts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own learned concepts"
  on public.learned_concepts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own learned concepts"
  on public.learned_concepts for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.learned_concepts from anon, public;
grant select, insert, update, delete on table public.learned_concepts to authenticated;
