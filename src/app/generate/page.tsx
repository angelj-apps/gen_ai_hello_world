import Link from "next/link";
import { redirect } from "next/navigation";
import { GenerateForm } from "@/components/GenerateForm";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SiteNav } from "@/components/SiteNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Spot } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <main className="flex w-full max-w-2xl flex-col gap-8">
          <SiteNav />
          <header className="flex flex-col gap-2">
            <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Members only
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Generate a caption
            </h1>
            <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Sign in to create AI captions for the feed.
            </p>
          </header>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <GoogleSignInButton />
          </div>
        </main>
      </div>
    );
  }

  const { data: spots } = await supabase
    .from("spots")
    .select("id, name, neighborhood, note")
    .order("name");

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            HW4
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Generate a caption
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Pick an NYC or Boston stop — coffee, subway, parks, arcades — and get a
            chronically online take. The prompt is saved with the caption.
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <GenerateForm spots={(spots as Spot[]) ?? []} />
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          After it saves, head back to the{" "}
          <Link href="/" className="underline underline-offset-2">
            feed
          </Link>{" "}
          and rate what everyone posted.
        </p>
      </main>
    </div>
  );
}
