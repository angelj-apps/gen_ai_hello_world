import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
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
    <nav className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-accent uppercase">
            lt
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-accent">
            Little Tools
          </span>
        </Link>
        <NavLinks showProfile={Boolean(email)} />
      </div>

      <div className="flex items-center gap-3 text-sm">
        {email ? (
          <>
            <span className="hidden max-w-[12rem] truncate font-mono text-xs text-muted sm:inline">
              {email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md border border-line bg-surface-raised px-3 py-1.5 text-ink transition hover:border-accent hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-ink px-3 py-1.5 font-medium text-surface-raised transition hover:bg-accent"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
