create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  neighborhood text not null,
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.spots enable row level security;

drop policy if exists "Public can read spots" on public.spots;

create policy "Public can read spots"
  on public.spots
  for select
  to anon, authenticated
  using (true);

insert into public.spots (name, neighborhood, note)
values
  ('Joe''s Steam Rice Roll', 'Chinatown', 'Late-night rice rolls and soy sauce noodles.'),
  ('Tatte Bakery', 'Back Bay', 'Good laptop seating and a reliable oat latte.'),
  ('Trident Booksellers', 'Newbury Street', 'Bookstore cafe — grab a window table upstairs.'),
  ('Pavement Coffeehouse', 'Fenway', 'Strong drip coffee near campus.');
