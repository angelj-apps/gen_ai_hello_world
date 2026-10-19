import { redirect } from "next/navigation";
import { CanvasShell } from "@/components/CanvasShell";
import { CurriculumWaterfall } from "@/components/CurriculumWaterfall";
import { SiteNav } from "@/components/SiteNav";
import { CONCEPT_BY_ID } from "@/lib/concepts";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ToolkitPage() {
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

  let { data: learnedRows, error } = await supabase
    .from("learned_concepts")
    .select("concept_id, skill_points")
    .eq("user_id", user.id);

  if (error?.message?.toLowerCase().includes("skill_points")) {
    const fallback = await supabase
      .from("learned_concepts")
      .select("concept_id")
      .eq("user_id", user.id);
    learnedRows = (fallback.data ?? []).map((row) => ({
      ...row,
      skill_points: 0,
    }));
    error = fallback.error;
  }

  const pathProgress = (learnedRows ?? [])
    .filter((row) => CONCEPT_BY_ID[row.concept_id as string])
    .map((row) => ({
      conceptId: row.concept_id as string,
      skillPoints: Number(row.skill_points ?? 0),
    }));

  return (
    <CanvasShell nav={<SiteNav />}>
      <div className="flex flex-col gap-3">
        <header className="flex w-fit flex-row items-baseline justify-between gap-4 border border-line bg-surface-raised px-3 py-1.5">
          <h1 className="text-[1.35rem] font-semibold leading-tight tracking-tight text-ink">
            Toolkit
          </h1>
          {error ? (
            <p className="text-sm text-muted">
              Could not load path progress ({error.message}).
            </p>
          ) : null}
        </header>

        <CurriculumWaterfall progress={pathProgress} />
      </div>
    </CanvasShell>
  );
}
