import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function SiteNav() {
  let email: string | null = null;

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      email = user?.email ?? null;
    } catch {
      email = null;
    }
  }

  return (
    <nav className="flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <Link href="/" className="hover:text-zinc-950 dark:hover:text-zinc-50">
          Spots
        </Link>
        <Link
          href="/favorites"
          className="hover:text-zinc-950 dark:hover:text-zinc-50"
        >
          Favorites
        </Link>
        {email ? (
          <Link
            href="/profile"
            className="hover:text-zinc-950 dark:hover:text-zinc-50"
          >
            Profile
          </Link>
        ) : null}
      </div>

      <div className="flex items-center gap-3 text-sm">
        {email ? (
          <>
            <span className="hidden max-w-[12rem] truncate text-zinc-500 sm:inline dark:text-zinc-400">
              {email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-zinc-950 px-3 py-1.5 text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
