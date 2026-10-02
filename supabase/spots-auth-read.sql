-- Run this in the SQL editor (gen_ai project).
-- Keeps spots private to signed-in users and seeds the four coffee rows.

alter table public.spots enable row level security;

drop policy if exists "Public can read spots" on public.spots;
drop policy if exists "Signed-in users can read spots" on public.spots;

create policy "Signed-in users can read spots"
  on public.spots
  for select
  to authenticated
  using (true);

grant select on table public.spots to authenticated;

insert into public.spots (name, neighborhood, note)
select v.name, v.neighborhood, v.note
from (
  values
    ('Joe''s Steam Rice Roll', 'Chinatown', 'Late-night rice rolls and soy sauce noodles.'),
    ('Tatte Bakery', 'Back Bay', 'Good laptop seating and a reliable oat latte.'),
    ('Trident Booksellers', 'Newbury Street', 'Bookstore cafe — grab a window table upstairs.'),
    ('Pavement Coffeehouse', 'Fenway', 'Strong drip coffee near campus.')
) as v(name, neighborhood, note)
where not exists (
  select 1 from public.spots s where s.name = v.name
);
