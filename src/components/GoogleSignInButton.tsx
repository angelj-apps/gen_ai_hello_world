"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  onError?: (message: string) => void;
};

export function GoogleSignInButton({ onError }: Props) {
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    if (pending) return;
    setPending(true);
    onError?.("");

    try {
      const supabase = createClient();
      const origin = window.location.origin;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Must be exactly /auth/callback — no other query parameters.
          redirectTo: `${origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        onError?.(error.message);
        setPending(false);
        return;
      }

      if (!data.url) {
        onError?.(
          "Google sign-in did not return a URL. Is Google enabled in Supabase Auth?",
        );
        setPending(false);
        return;
      }

      window.location.assign(data.url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start Google sign-in.";
      onError?.(message);
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      disabled={pending}
      className="lt-signon-google"
    >
      {pending ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}
