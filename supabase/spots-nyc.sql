-- Extra NYC spots (non-coffee). Safe to re-run.
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
