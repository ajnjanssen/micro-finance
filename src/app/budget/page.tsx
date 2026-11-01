"use client";

import { useCallback, useEffect, useState } from "react";
import ConfigurationSection from "@/app/settings/components/ConfigurationSection";
import Budget503020 from "@/components/Budget503020";
import BudgetPlanner from "@/components/BudgetPlanner";
import type { FinancialData } from "@/types/finance";

export default function BudgetPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showConfiguration, setShowConfiguration] = useState(false);

  const loadFinancialData = useCallback(async () => {
    try {
      const response = await fetch("/api/finance");
      const data = await response.json();
      setFinancialData(data);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFinancialData();
  }, [loadFinancialData]);

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-base-300 rounded w-1/4"></div>
          <div className="h-64 bg-base-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="min-h-screen p-6">
        <div className="alert alert-error">
          <span>Kan financiële data niet laden</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-base-content sm:text-3xl">
            Budget
          </h1>
          <button
            type="button"
            className="btn btn-primary btn-sm w-full sm:w-auto"
            onClick={() => setShowConfiguration(!showConfiguration)}
          >
            {showConfiguration ? "Verberg" : "⚙️ Configureer"} Budget
          </button>
        </div>

        <div className="space-y-6">
          {showConfiguration && (
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <ConfigurationSection onUpdate={loadFinancialData} />
              </div>
            </div>
          )}

          <Budget503020 />
          <BudgetPlanner />
        </div>
      </div>
    </div>
  );
}
