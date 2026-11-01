"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loadingProvider, setLoadingProvider] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("error")) {
      setError("De aanmelding is niet afgerond. Probeer het opnieuw.");
    }
  }, []);

  const signIn = async (provider: "google" | "azure") => {
    setError("");
    setLoadingProvider(provider);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const next = searchParams.get("next");
      const destination =
        next?.startsWith("/") && !next.startsWith("//") ? next : "/";
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", destination);
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
          ...(provider === "azure" ? { scopes: "email" } : {}),
        },
      });

      if (signInError) {
        setError(signInError.message);
        setLoadingProvider("");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Onbekende fout.");
      setLoadingProvider("");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <section className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body gap-5">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Micro Finance</h1>
            <p className="mt-2 text-base-content/70">
              Log in om je persoonlijke financiën te bekijken.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={Boolean(loadingProvider)}
            onClick={() => signIn("google")}
          >
            {loadingProvider === "google"
              ? "Doorsturen..."
              : "Doorgaan met Google"}
          </button>
          <button
            type="button"
            className="btn btn-outline w-full"
            disabled={Boolean(loadingProvider)}
            onClick={() => signIn("azure")}
          >
            {loadingProvider === "azure"
              ? "Doorsturen..."
              : "Doorgaan met Microsoft"}
          </button>
          {error && (
            <p role="alert" className="text-sm text-error">
              Inloggen mislukt: {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
