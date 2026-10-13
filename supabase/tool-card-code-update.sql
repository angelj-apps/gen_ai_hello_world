-- Let learners edit code on tool cards they created (auto-save in UI).

drop policy if exists "Users update own tool cards" on public.tool_cards;

create policy "Users update own tool cards"
  on public.tool_cards for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant update on table public.tool_cards to authenticated;
