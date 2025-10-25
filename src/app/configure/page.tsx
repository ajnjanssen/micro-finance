"use client";

import { useState, useEffect } from "react";
import LoadingState from "@/components/ui/LoadingState";
import PageHeader from "@/components/ui/PageHeader";

export default function ConfigurePage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/config");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: any) => {
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });

      if (response.ok) {
        await loadConfig();
        alert("Configuratie opgeslagen!");
      }
    } catch (error) {
      console.error("Error saving config:", error);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader title="Configuratie" buttonLabel="Opslaan" onButtonClick={() => saveConfig(config)} />
        
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Financiële Configuratie</h2>
          <p className="text-sm text-base-content/70">
            Configureer je vaste lasten en inkomsten hier.
          </p>
        </div>
      </div>
    </div>
  );
}
