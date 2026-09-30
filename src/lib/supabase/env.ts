export function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  const match = trimmed.match(/https:\/\/[a-z0-9]+\.supabase\.co/i);
  return match?.[0] ?? trimmed;
}

export function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseKey()?.trim();
  const url = rawUrl ? normalizeSupabaseUrl(rawUrl) : "";

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return { url, key };
}

export function hasSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseKey()?.trim();
  const url = rawUrl
    ? rawUrl.match(/https:\/\/[a-z0-9]+\.supabase\.co/i)?.[0]
    : null;
  return Boolean(url && key);
}
