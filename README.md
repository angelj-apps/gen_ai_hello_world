# Weekend captions

Next.js app for Gen UI. Logged-in users generate AI captions for NYC and Boston weekend spots, store the prompt + caption, and upvote/downvote the feed.

## Why this exists (for Sam)

Sam is chronically online, new to the East Coast (NYC + Boston), and looks for a daily dorm ritual. The feed gives a reason to open the site every day: fresh captions, vote wars, and a place to dump the weird Saturday feeling into something shareable. Popular content comes from ranking — funny captions float up. Crackd.ai is stronger when generation and rating live in one loop; this app does the same with captions instead of photos.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `OPENROUTER_API_KEY` (server-only — also add this in Vercel)
- optional: `OPENROUTER_MODEL` (defaults to `openrouter/auto`)
- If generation fails with a guardrails message, open [OpenRouter Guardrails](https://openrouter.ai/workspaces/default/guardrails) and allow at least one model.

Do not commit real keys.

```bash
npm install
npm run dev
```

## Supabase setup

Run these in the SQL editor, in order if you are new:

1. `supabase/spots.sql` (or `spots-auth-read.sql` if spots already exists)
2. `supabase/profiles.sql`
3. **`supabase/hw4.sql`** — generations, votes, score trigger, strict RLS

### RLS summary (HW4)

| Table | Read | Write |
| --- | --- | --- |
| `spots` | authenticated | none from clients |
| `profiles` | authenticated | insert/update own row |
| `generations` | authenticated | insert own row |
| `votes` | own rows only | insert/update/delete own rows |

`generations.score` is updated by a `security definer` trigger when votes change. Clients cannot update scores directly.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Ranked caption feed + voting (sign-in required) |
| `/generate` | Create an AI caption for a spot (sign-in required) |
| `/login` | Google sign-in |
| `/auth/callback` | OAuth code exchange |
| `/profile` | Name + photo |
| `/favorites` | Gated shortlist from earlier assignments |

## Deploy

1. Push to GitHub / Vercel.
2. Set the same env vars on Vercel (including `OPENROUTER_API_KEY`).
3. Turn off Deployment Protection so Incognito works.
4. Submit the **commit-specific** Vercel URL.
