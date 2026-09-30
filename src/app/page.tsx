import { getSupabaseClient, getSupabaseKey, type Spot } from "@/lib/supabase";
import { SiteNav } from "@/components/SiteNav";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  profileNeedsNames,
  type Profile,
} from "@/lib/supabase/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

function MissingEnv() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-medium">Supabase environment variables are missing.</p>
      <p className="mt-2 text-sm leading-6 opacity-80">
        Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to{" "}
        <code className="font-mono">.env.local</code>, then run the SQL in{" "}
        <code className="font-mono">supabase/spots.sql</code> and{" "}
        <code className="font-mono">supabase/profiles.sql</code>.
      </p>
    </div>
  );
}

export default async function Home() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
    /https:\/\/[a-z0-9]+\.supabase\.co/i,
  )?.[0];
  const anonKey = getSupabaseKey()?.trim();

  let spots: Spot[] = [];
  let fetchError: string | null = null;
  let needsProfile = false;

  if (url && anonKey) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("spots")
      .select("id, name, neighborhood, note")
      .order("name");

    if (error) {
      fetchError = error.message;
    } else {
      spots = data ?? [];
    }
  }

  if (hasSupabaseEnv()) {
    try {
      const authClient = await createClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();

      if (user) {
        const { data: profile } = await authClient
          .from("profiles")
          .select(
            "id, first_name, last_name, avatar_url, favorite_drink, updated_at",
          )
          .eq("id", user.id)
          .maybeSingle();

        needsProfile = profileNeedsNames((profile as Profile | null) ?? null);
      }
    } catch {
      // Ignore auth errors on the public home page.
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            HW2 + HW3
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Boston coffee spots
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Rows loaded from a Supabase <code className="font-mono text-base">spots</code>{" "}
            table. Sign in for Profile and the gated Favorites route.
          </p>
        </header>

        {needsProfile ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-medium">Welcome — finish your profile</p>
            <p className="mt-1 text-sm opacity-80">
              Your first or last name is still empty.{" "}
              <Link href="/profile" className="underline underline-offset-2">
                Add your name
              </Link>{" "}
              (and optionally a photo).
            </p>
          </div>
        ) : null}

        {!url || !anonKey ? <MissingEnv /> : null}

        {fetchError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            <p className="font-medium">Could not load spots.</p>
            <p className="mt-1 text-sm opacity-80">{fetchError}</p>
          </div>
        ) : null}

        {url && anonKey && !fetchError && spots.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No rows yet. Run <code className="font-mono">supabase/spots.sql</code> in the
            Supabase SQL editor.
          </p>
        ) : null}

        <ul className="grid gap-4">
          {spots.map((spot) => (
            <li
              key={spot.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {spot.neighborhood}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                {spot.name}
              </h2>
              <p className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">
                {spot.note}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
