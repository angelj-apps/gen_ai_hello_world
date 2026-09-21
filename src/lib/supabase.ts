import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Spot = {
  id: string;
  name: string;
  neighborhood: string;
  note: string;
};

export function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  const match = trimmed.match(/https:\/\/[a-z0-9]+\.supabase\.co/i);
  return match?.[0] ?? trimmed;
}

export function getSupabaseClient(): SupabaseClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseKey()?.trim();
  const url = rawUrl ? normalizeSupabaseUrl(rawUrl) : "";

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createClient(url, key);
}
