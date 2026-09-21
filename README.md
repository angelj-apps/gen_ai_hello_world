# gen_ai_hello_world

Next.js app for Gen UI. HW2 loads a list of coffee spots from Supabase.

## Environment variables

Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable key (this is the same as the older “anon” key). Do not commit real keys.

Then run `supabase/spots.sql` in the Supabase SQL editor to create and seed the `spots` table.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the list.
