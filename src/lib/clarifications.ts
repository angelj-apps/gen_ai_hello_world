import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolCardClarification } from "@/lib/supabase/types";

export function canClarifyCard(
  cardUserId: string | null | undefined,
  currentUserId: string,
) {
  return !cardUserId || cardUserId === currentUserId;
}

/** Only the creator can edit persisted card code (not shared seed cards). */
export function canEditToolCardCode(
  cardUserId: string | null | undefined,
  currentUserId: string,
) {
  return Boolean(cardUserId && cardUserId === currentUserId);
}

export async function loadClarificationsByCardIds(
  supabase: SupabaseClient,
  userId: string,
  cardIds: string[],
): Promise<Map<string, ToolCardClarification[]>> {
  const map = new Map<string, ToolCardClarification[]>();
  if (cardIds.length === 0) return map;

  const { data, error } = await supabase
    .from("tool_card_clarifications")
    .select("*")
    .eq("user_id", userId)
    .in("tool_card_id", cardIds)
    .order("created_at", { ascending: true });

  if (error) return map;

  for (const row of data ?? []) {
    const cardId = row.tool_card_id as string;
    const list = map.get(cardId) ?? [];
    list.push(row as ToolCardClarification);
    map.set(cardId, list);
  }
  return map;
}
