# Little Tools

Next.js app for learning beginner Python: a small related capability horizon, “How do I …?”, attempt first, then open syntax when stuck. Save tools, vote on a shared feed, and practice by combining saved cards.

## Environment variables

Copy `.env.example` to `.env.local` (or create `.env.local`) and fill in:

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

Run these in the SQL editor (same project as auth):

1. `supabase/profiles.sql` (if profiles / Google auth are not set up yet)
2. **`supabase/little-tools.sql`** — `tool_cards`, `tool_votes`, `saved_tools`, `practice_attempts`, score trigger, RLS, seed cards
3. **`supabase/concepts.sql`** — `learned_concepts` + optional `concept_id` / `learner_attempt` on `tool_cards`
4. **`supabase/clarifications.sql`** — `tool_card_clarifications` for stacked follow-ups
5. **`supabase/tool-card-code-update.sql`** — allow updating `code` on your own tool cards (auto-save in UI)
6. **`supabase/skill-points.sql`** — `skill_points` on `learned_concepts` + update policy

Concept definitions and adjacency live in `src/lib/concepts.ts` (20 beginner concepts).

### RLS summary

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | authenticated | insert/update own row |
| `tool_cards` | authenticated | insert own row; update own row (e.g. code); score via trigger only |
| `tool_votes` | own rows | insert/update/delete own rows |
| `saved_tools` | own rows | insert/delete own rows |
| `practice_attempts` | own rows | insert/update own rows |
| `learned_concepts` | own rows | insert own rows |
| `tool_card_clarifications` | own rows | insert/update/delete own rows |

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Capability horizon → How do I …? → attempt → syntax card |
| `/explore` | Ranked shared feed (syntax collapsed by default) |
| `/toolkit` | Grid of learned skills + skillpoints; tap tile for card |
| `/practice` | Select skills → generate problem → grade → skillpoints |
| `/library` | Redirects to `/toolkit` |
| `/login` | Google sign-in |
| `/auth/callback` | OAuth code exchange |
| `/profile` | Name + photo |

## Deploy

1. Push to GitHub / Vercel.
2. Set the same env vars on Vercel (including `OPENROUTER_API_KEY`).
3. Run SQL migrations on production (`little-tools`, `concepts`, `clarifications`, `tool-card-code-update`, `skill-points`).
4. Turn off Deployment Protection so Incognito works if required for grading.
