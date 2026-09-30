"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  async function signInWithGoogle() {
    const supabase = createClient();
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Must be exactly /auth/callback — no other query parameters.
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      Continue with Google
    </button>
  );
}
