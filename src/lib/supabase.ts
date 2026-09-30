import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseKey, hasSupabaseEnv } from "./supabase/env";
import type { Spot } from "./supabase/types";

export type { Spot };
export { getSupabaseKey, hasSupabaseEnv };

export function getSupabaseClient(): SupabaseClient {
  const { url, key } = getSupabaseEnv();
  return createClient(url, key);
}
