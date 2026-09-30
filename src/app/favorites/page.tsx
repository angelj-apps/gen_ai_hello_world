import Link from "next/link";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SiteNav } from "@/components/SiteNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  profileNeedsNames,
  type Profile,
} from "@/lib/supabase/types";

export default async function FavoritesPage() {
  let userEmail: string | null = null;
  let profile: Profile | null = null;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email ?? null;
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, first_name, last_name, avatar_url, favorite_drink, updated_at",
        )
        .eq("id", user.id)
        .maybeSingle();
      profile = (data as Profile | null) ?? null;
    }
  }

  // Gated UI: this route only reveals member content when logged in.
  if (!userEmail) {
    return (
      <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <main className="flex w-full max-w-2xl flex-col gap-8">
          <SiteNav />
          <header className="flex flex-col gap-2">
            <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Members only
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Favorites
            </h1>
            <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Sign in to see your private coffee shortlist.
            </p>
          </header>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              This page is protected. Guests only see this gated message.
            </p>
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

  if (profileNeedsNames(profile)) {
    return (
      <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <main className="flex w-full max-w-2xl flex-col gap-8">
          <SiteNav />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-medium">Add your name first</p>
            <p className="mt-1 text-sm opacity-80">
              Your profile is missing a first or last name.{" "}
              <Link href="/profile" className="underline underline-offset-2">
                Complete your profile
              </Link>{" "}
              to unlock Favorites.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const displayName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Members only
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {displayName}&apos;s favorites
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Signed in as {userEmail}. This list is only visible while you are logged
            in.
          </p>
        </header>

        <ul className="grid gap-4">
          <li className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Back Bay
            </p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Tatte Bakery
            </h2>
            <p className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">
              Your go-to laptop seat and oat latte.
            </p>
          </li>
          <li className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Newbury Street
            </p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Trident Booksellers
            </h2>
            <p className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">
              Quiet upstairs window table for reading.
            </p>
          </li>
        </ul>

        {profile?.favorite_drink ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Usual order:{" "}
            <span className="font-medium text-zinc-950 dark:text-zinc-50">
              {profile.favorite_drink}
            </span>
          </p>
        ) : null}
      </main>
    </div>
  );
}
