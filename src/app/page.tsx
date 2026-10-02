import Link from "next/link";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SiteNav } from "@/components/SiteNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  profileNeedsNames,
  type Profile,
  type Spot,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function SignedOutGate() {
  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Members only
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Boston coffee spots
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Sign in to see the list.
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <GoogleSignInButton />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Or{" "}
            <Link href="/login" className="underline underline-offset-2">
              open the login page
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

export default async function Home() {
  if (!hasSupabaseEnv()) {
    return <SignedOutGate />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SignedOutGate />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, favorite_drink, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const needsProfile = profileNeedsNames((profile as Profile | null) ?? null);

  const { data, error } = await supabase
    .from("spots")
    .select("id, name, neighborhood, note")
    .order("name");

  const spots: Spot[] = data ?? [];

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Members only
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Boston coffee spots
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Your coffee map, visible only while you are signed in.
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

        {error ? (
          <p className="text-zinc-600 dark:text-zinc-400">Could not load spots.</p>
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
