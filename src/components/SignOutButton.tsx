"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");

  const signOut = async () => {
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Onbekende fout.");
    }
  };

  return (
    <div className="p-4">
      <button
        type="button"
        className="btn btn-outline btn-sm w-full"
        onClick={signOut}
      >
        Uitloggen
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-error">
          Uitloggen mislukt: {error}
        </p>
      )}
    </div>
  );
}
