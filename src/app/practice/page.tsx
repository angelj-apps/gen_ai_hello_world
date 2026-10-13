import Link from "next/link";
import { redirect } from "next/navigation";
import { PracticeClient } from "@/components/PracticeClient";
import { SiteNav } from "@/components/SiteNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count } = await supabase
    .from("saved_tools")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const savedCount = count ?? 0;

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Practice
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Combine 1–2 tools from your library into a short beginner task. Write
            an attempt, then reveal a sample solution.
          </p>
        </header>

        {savedCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center dark:border-zinc-700">
            <p className="text-zinc-700 dark:text-zinc-300">
              Save at least one tool before practicing.
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-block text-sm underline underline-offset-2"
            >
              Explore tools
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You have {savedCount} saved tool{savedCount === 1 ? "" : "s"}.
            </p>
            <PracticeClient />
          </>
        )}
      </main>
    </div>
  );
}
