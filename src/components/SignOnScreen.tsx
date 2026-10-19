"use client";

import Link from "next/link";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

type Props = {
  error?: boolean;
};

/** Single clean signed-out surface — brand, one line, one CTA. */
export function SignOnScreen({ error = false }: Props) {
  const [clientError, setClientError] = useState<string | null>(null);
  const showError = error || Boolean(clientError);

  return (
    <div className="lt-signon">
      <div className="lt-signon-panel studio-fade-up">
        <Link href="/login" className="lt-signon-brand">
          <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-accent uppercase">
            lt
          </span>
          <span className="text-[clamp(2rem,6vw,3.25rem)] font-semibold tracking-tight text-ink">
            Little Tools
          </span>
        </Link>

        <p className="lt-signon-lede">
          Atomic Python skills for interview prep — try first, then unlock the
          syntax.
        </p>

        {showError ? (
          <div className="lt-signon-error" role="alert">
            <p className="font-semibold text-ink">Could not complete sign-in.</p>
            <p className="mt-1 text-sm text-muted">
              {clientError ?? (
                <>
                  Check that Google is enabled in Supabase and the redirect URI
                  is{" "}
                  <code className="font-mono text-ink">/auth/callback</code>.
                </>
              )}
            </p>
          </div>
        ) : null}

        <div className="lt-signon-cta">
          <GoogleSignInButton
            onError={(message) => setClientError(message || null)}
          />
        </div>
      </div>
    </div>
  );
}
