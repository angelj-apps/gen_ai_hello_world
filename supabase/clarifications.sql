-- Additive "Still confused?" follow-ups on tool cards (personal learning notes).

create table if not exists public.tool_card_clarifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tool_card_id uuid not null references public.tool_cards (id) on delete cascade,
  question_text text not null,
  answer_text text not null,
  kind text not null default 'custom'
    check (kind in ('custom', 'simpler', 'example')),
  created_at timestamptz not null default now()
);

create index if not exists tool_card_clarifications_card_user_idx
  on public.tool_card_clarifications (tool_card_id, user_id, created_at asc);

alter table public.tool_card_clarifications enable row level security;

drop policy if exists "Users read own clarifications" on public.tool_card_clarifications;
drop policy if exists "Users insert own clarifications" on public.tool_card_clarifications;
drop policy if exists "Users update own clarifications" on public.tool_card_clarifications;
drop policy if exists "Users delete own clarifications" on public.tool_card_clarifications;

create policy "Users read own clarifications"
  on public.tool_card_clarifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own clarifications"
  on public.tool_card_clarifications for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own clarifications"
  on public.tool_card_clarifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own clarifications"
  on public.tool_card_clarifications for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.tool_card_clarifications from anon, public;
grant select, insert, update, delete on table public.tool_card_clarifications to authenticated;
