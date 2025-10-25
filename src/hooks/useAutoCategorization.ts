import { useState } from "react";

export function useAutoCategorization(reload: () => Promise<void>) {
  const [results, setResults] = useState<any>(null);

  const preview = async () => {
    try {
      const response = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "auto-categorize-preview" }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Auto-categorization error:", error);
    }
  };

  const apply = async () => {
    try {
      const response = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "auto-categorize" }),
      });

      if (response.ok) {
        await reload();
        setResults(null);
      }
    } catch (error) {
      console.error("Apply error:", error);
    }
  };

  return { results, preview, apply };
}
