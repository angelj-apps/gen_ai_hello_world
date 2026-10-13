import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseKey, hasSupabaseEnv } from "./supabase/env";

export { getSupabaseKey, hasSupabaseEnv };

export function getSupabaseClient(): SupabaseClient {
  const { url, key } = getSupabaseEnv();
  return createClient(url, key);
}
