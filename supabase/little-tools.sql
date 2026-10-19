-- Little Tools: tool cards, votes, saved library, practice attempts.
-- Run in the Supabase SQL editor (same project as auth/profiles).

-- Tool cards: AI-generated small Python tools.
create table if not exists public.tool_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  goal text not null,
  title text not null,
  what_it_does text not null,
  code text not null,
  example_input text not null,
  example_output text not null,
  explanation text not null,
  when_to_use text not null,
  try_changing text not null,
  tags text[] not null default '{}',
  difficulty text not null default 'beginner',
  prompt text not null,
  system_prompt text not null,
  score integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tool_cards_score_idx
  on public.tool_cards (score desc, created_at desc);

alter table public.tool_cards enable row level security;

drop policy if exists "Authenticated can read tool cards" on public.tool_cards;
drop policy if exists "Users insert own tool cards" on public.tool_cards;
drop policy if exists "Users update own tool cards" on public.tool_cards;

create policy "Authenticated can read tool cards"
  on public.tool_cards for select
  to authenticated
  using (true);

create policy "Users insert own tool cards"
  on public.tool_cards for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own tool cards"
  on public.tool_cards for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on table public.tool_cards from anon, public;
grant select, insert, update on table public.tool_cards to authenticated;

-- Votes on tool cards (one per user per card).
create table if not exists public.tool_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tool_card_id uuid not null references public.tool_cards (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (user_id, tool_card_id)
);

alter table public.tool_votes enable row level security;

drop policy if exists "Users read own tool votes" on public.tool_votes;
drop policy if exists "Users insert own tool votes" on public.tool_votes;
drop policy if exists "Users update own tool votes" on public.tool_votes;
drop policy if exists "Users delete own tool votes" on public.tool_votes;

create policy "Users read own tool votes"
  on public.tool_votes for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own tool votes"
  on public.tool_votes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own tool votes"
  on public.tool_votes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own tool votes"
  on public.tool_votes for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.tool_votes from anon, public;
grant select, insert, update, delete on table public.tool_votes to authenticated;

create or replace function public.tool_votes_adjust_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.tool_cards
      set score = score + new.value
      where id = new.tool_card_id;
    return new;
  elsif tg_op = 'UPDATE' then
    update public.tool_cards
      set score = score - old.value + new.value
      where id = new.tool_card_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.tool_cards
      set score = score - old.value
      where id = old.tool_card_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists tool_votes_adjust_score on public.tool_votes;
create trigger tool_votes_adjust_score
  after insert or update or delete on public.tool_votes
  for each row execute procedure public.tool_votes_adjust_score();

-- Personal toolkit.
create table if not exists public.saved_tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tool_card_id uuid not null references public.tool_cards (id) on delete cascade,
  saved_at timestamptz not null default now(),
  unique (user_id, tool_card_id)
);

alter table public.saved_tools enable row level security;

drop policy if exists "Users read own saved tools" on public.saved_tools;
drop policy if exists "Users insert own saved tools" on public.saved_tools;
drop policy if exists "Users delete own saved tools" on public.saved_tools;

create policy "Users read own saved tools"
  on public.saved_tools for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own saved tools"
  on public.saved_tools for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users delete own saved tools"
  on public.saved_tools for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.saved_tools from anon, public;
grant select, insert, delete on table public.saved_tools to authenticated;

-- Practice attempts (P1).
create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  prompt_text text not null,
  tool_card_ids uuid[] not null default '{}',
  user_answer text,
  hint text,
  sample_solution text,
  explanation text,
  outcome text,
  created_at timestamptz not null default now()
);

alter table public.practice_attempts enable row level security;

drop policy if exists "Users read own practice" on public.practice_attempts;
drop policy if exists "Users insert own practice" on public.practice_attempts;
drop policy if exists "Users update own practice" on public.practice_attempts;

create policy "Users read own practice"
  on public.practice_attempts for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own practice"
  on public.practice_attempts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own practice"
  on public.practice_attempts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on table public.practice_attempts from anon, public;
grant select, insert, update on table public.practice_attempts to authenticated;

-- Seed starter cards (cold start). user_id null = system/reviewed.
insert into public.tool_cards (
  user_id, goal, title, what_it_does, code, example_input, example_output,
  explanation, when_to_use, try_changing, tags, difficulty, prompt, system_prompt
)
select
  null,
  v.goal, v.title, v.what_it_does, v.code, v.example_input, v.example_output,
  v.explanation, v.when_to_use, v.try_changing, v.tags, v.difficulty,
  'seed', 'seed'
from (
  values
    (
      'check whether an item exists in a list',
      'Check membership with in',
      'Tells you whether a value appears somewhere in a list.',
      $c$name = "Sam"
friends = ["Alex", "Sam", "Jordan"]
print(name in friends)$c$,
      'name = "Sam"; friends = ["Alex", "Sam", "Jordan"]',
      'True',
      '`in` asks Python: is this value among the items in this collection? It returns True or False.',
      'When you need a yes/no answer about whether something is already in a list.',
      'Change `name` to "Riley" and run again — what prints?',
      array['lists','membership','in'],
      'beginner'
    ),
    (
      'get the number of items in a list',
      'Count items with len()',
      'Returns how many elements are in a list (or other sequence).',
      $c$scores = [90, 85, 100]
print(len(scores))$c$,
      'scores = [90, 85, 100]',
      '3',
      '`len(...)` stands for length. Pass a list and you get an integer count.',
      'When you care about how many things you have, not what they are.',
      'Add another score to the list. Does `len(scores)` change?',
      array['lists','len'],
      'beginner'
    ),
    (
      'compare two values for equality',
      'Compare with ==',
      'Checks whether two values are equal and returns True or False.',
      $c$password = "open"
guess = "open"
print(guess == password)$c$,
      'guess = "open"; password = "open"',
      'True',
      '`==` is the equality operator. Use one `=` to assign, two `==` to compare.',
      'When you need to branch or print based on a match.',
      'Set `guess` to "closed". What does the comparison print now?',
      array['comparison','booleans'],
      'beginner'
    ),
    (
      'get the first item of a list',
      'Index the first element',
      'Pulls one item from a list by its position starting at 0.',
      $c$cities = ["NYC", "Boston", "Chicago"]
print(cities[0])$c$,
      'cities = ["NYC", "Boston", "Chicago"]',
      'NYC',
      'Lists are zero-indexed: the first item is at index 0, not 1.',
      'When you need a single known position in a list.',
      'Print `cities[1]` — which city appears?',
      array['lists','indexing'],
      'beginner'
    ),
    (
      'repeat an action for each item in a list',
      'Loop with for',
      'Runs a block of code once for every item in a list.',
      $c$names = ["Sam", "Alex"]
for name in names:
    print(name)$c$,
      'names = ["Sam", "Alex"]',
      'Sam\nAlex',
      '`for name in names:` means: take each item, call it `name`, then run the indented lines.',
      'When the same step should happen for every element.',
      'Add a third name to the list and run again.',
      array['loops','for'],
      'beginner'
    ),
    (
      'check that something is missing from a list',
      'Check absence with not in',
      'Returns True when a value is not found in a list.',
      $c$blocked = ["spam"]
sender = "friend"
print(sender not in blocked)$c$,
      'sender = "friend"; blocked = ["spam"]',
      'True',
      '`not in` flips membership: True means the value is absent.',
      'When you want to allow something only if it is not already listed.',
      'Put "friend" into `blocked`. What does the print become?',
      array['lists','membership','not in'],
      'beginner'
    )
) as v(
  goal, title, what_it_does, code, example_input, example_output,
  explanation, when_to_use, try_changing, tags, difficulty
)
where not exists (
  select 1 from public.tool_cards t where t.title = v.title and t.prompt = 'seed'
);
