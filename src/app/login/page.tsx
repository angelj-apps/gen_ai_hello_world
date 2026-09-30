import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SiteNav } from "@/components/SiteNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/profile");
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            HW3
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Sign in
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Use Google to create an account or log back in. After the first sign-in,
            a row is created in the <code className="font-mono text-base">profiles</code>{" "}
            table.
          </p>
        </header>

        {params.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            <p className="font-medium">Could not complete sign-in.</p>
            <p className="mt-1 text-sm opacity-80">
              Check that Google is enabled in Supabase and that the redirect URI is{" "}
              <code className="font-mono">/auth/callback</code>.
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <GoogleSignInButton />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Or go back to{" "}
            <Link href="/" className="underline underline-offset-2">
              coffee spots
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
