"use client";

import { useState, useEffect } from "react";
import Budget503020 from "@/components/Budget503020";
import BudgetPlanner from "@/components/BudgetPlanner";
import { FinancialData } from "@/types/finance";

export default function BudgetPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const response = await fetch("/api/finance");
      const data = await response.json();
      setFinancialData(data);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-base-content mb-6">Budget</h1>

        <div className="space-y-6">
          <Budget503020 />
          <BudgetPlanner />
        </div>
      </div>
    </div>
  );
}
