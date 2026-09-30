import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { SiteNav } from "@/components/SiteNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  profileNeedsNames,
  type Profile,
} from "@/lib/supabase/types";

async function ensureProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, favorite_drink, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return existing as Profile;
  }

  // Fallback if the trigger has not fired yet (or user existed before the trigger).
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("id, first_name, last_name, avatar_url, favorite_drink, updated_at")
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return created as Profile;
}

export default async function ProfilePage() {
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

  const profile = await ensureProfile(user.id);

  if (!profile) {
    return (
      <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <main className="flex w-full max-w-2xl flex-col gap-8">
          <SiteNav />
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            <p className="font-medium">Could not load or create your profile.</p>
            <p className="mt-1 text-sm opacity-80">
              Run <code className="font-mono">supabase/profiles.sql</code> in the
              Supabase SQL editor, then refresh.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const needsNames = profileNeedsNames(profile);

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <SiteNav />
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            HW3
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Profile
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Update your name and upload a photo. Photos go to Supabase Storage; only
            the URL is saved on your profile row.
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <ProfileForm
            profile={profile}
            mode={needsNames ? "complete" : "edit"}
          />
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Signed in as {user.email}.{" "}
          <Link href="/favorites" className="underline underline-offset-2">
            Open Favorites
          </Link>
        </p>
      </main>
    </div>
  );
}
