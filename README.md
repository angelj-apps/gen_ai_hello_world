# gen_ai_hello_world

Next.js app for Gen UI.

- **HW2:** loads coffee spots from a Supabase `spots` table (signed-in users only).
- **HW3:** Google OAuth, `profiles` table + trigger, Profile page (name + photo), gated `/favorites` route.

## Environment variables

Copy `.env.example` to `.env.local` (inside this app folder) and add your Supabase project URL and publishable key. Do not commit real keys.

Also set the same variables in Vercel for production.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup (HW3)

1. In the Supabase SQL editor, run `supabase/spots.sql` (if you have not already) and `supabase/profiles.sql`.
2. That creates:
   - `public.profiles` with nullable `first_name` / `last_name` (plus optional `avatar_url`, `favorite_drink`)
   - a trigger on `auth.users` that inserts a profile on first signup
   - a public `avatars` storage bucket (photo URL only in the DB — no binary blobs)
3. Authentication → URL configuration → add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_VERCEL_DOMAIN.vercel.app/auth/callback`
4. Create a Google OAuth client in Google Cloud Console:
   - Application type: Web
   - Authorized redirect URI: use the **Callback URL (for OAuth)** shown in Supabase → Authentication → Providers → Google (looks like `https://YOUR_PROJECT.supabase.co/auth/v1/callback`)
5. Paste the Google Client ID and Client Secret into Supabase → Authentication → Providers → Google and enable it.
6. Turn off Vercel Deployment Protection so Incognito can load the site.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Spots list (sign-in required) |
| `/login` | Google sign-in |
| `/auth/callback` | OAuth code exchange (redirectTo must be exactly this path) |
| `/profile` | Edit first/last name + upload photo |
| `/favorites` | Gated member UI (sign-in required) |

After login, if first/last name are empty, the home page and Profile prompt you to fill them in.
