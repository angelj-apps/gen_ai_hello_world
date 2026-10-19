import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { ProfileStats } from "@/components/ProfileStats";
import { SiteNav } from "@/components/SiteNav";
import { CONCEPT_BY_ID, MASTERY_SKILL_POINTS } from "@/lib/concepts";
import {
  computeStreak,
  waveProgressBars,
} from "@/lib/profile-stats";
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
      <div className="app-shell">
        <main className="app-main">
          <SiteNav />
          <div className="border border-danger bg-surface-raised px-5 py-4 text-ink">
            <p className="font-medium">Could not load your profile.</p>
            <p className="mt-1 text-sm text-muted">
              Try signing out and back in.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const needsNames = profileNeedsNames(profile);

  let { data: learnedRows } = await supabase
    .from("learned_concepts")
    .select("concept_id, skill_points, learned_at")
    .eq("user_id", user.id);

  if (!learnedRows) {
    const fallback = await supabase
      .from("learned_concepts")
      .select("concept_id, learned_at")
      .eq("user_id", user.id);
    learnedRows = (fallback.data ?? []).map((row) => ({
      ...row,
      skill_points: 0,
    }));
  }

  const { data: practiceRows } = await supabase
    .from("practice_attempts")
    .select("created_at")
    .eq("user_id", user.id);

  const progress = (learnedRows ?? [])
    .filter((row) => CONCEPT_BY_ID[row.concept_id as string])
    .map((row) => ({
      conceptId: row.concept_id as string,
      skillPoints: Number(row.skill_points ?? 0),
      learnedAt: (row.learned_at as string | null) ?? null,
    }));

  const activityIsos = [
    ...progress.map((row) => row.learnedAt).filter(Boolean),
    ...(practiceRows ?? []).map((row) => row.created_at as string),
  ] as string[];

  const streak = computeStreak(activityIsos);
  const waves = waveProgressBars(progress);
  const learnedCount = progress.length;
  const masteredCount = progress.filter(
    (row) => row.skillPoints >= MASTERY_SKILL_POINTS,
  ).length;

  return (
    <div className="app-shell">
      <main className="app-main">
        <SiteNav />
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-ink">
            Profile
          </h1>
        </header>

        <div className="lt-profile-desk">
          <ProfileStats
            streak={streak}
            learnedCount={learnedCount}
            masteredCount={masteredCount}
            waves={waves}
          />
          <div className="lt-ig-card">
            <ProfileForm
              profile={profile}
              email={user.email ?? ""}
              mode={needsNames ? "complete" : "edit"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
