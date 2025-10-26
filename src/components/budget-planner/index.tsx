"use client";

import { useState } from "react";
import { useBudgetData } from "./hooks/useBudgetData";
import { BudgetTable } from "./BudgetTable";
import { SummaryStats } from "./SummaryStats";
import { getMonthOptions, getCurrentMonth } from "./utils";

export default function BudgetPlanner() {
  const [savingsGoal, setSavingsGoal] = useState(1000);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const { budgets, unmappedCategories, loading } = useBudgetData(
    savingsGoal,
    selectedMonth
  );

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-base-300 rounded w-1/4" />
          <div className="h-8 bg-base-300 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow">
        <h2 className="text-2xl font-bold mb-4">Budget Planner</h2>

        <div className="flex gap-4 mb-6">
          <div className="form-control flex-1">
            <label className="label">
              <span className="label-text">Maand</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="select select-bordered"
            >
              {getMonthOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control flex-1">
            <label className="label">
              <span className="label-text">Spaardoel (€)</span>
            </label>
            <input
              type="number"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(Number(e.target.value))}
              className="input input-bordered"
            />
          </div>
        </div>

        {unmappedCategories.length > 0 && (
          <div className="alert alert-warning mb-4">
            <span>
              {unmappedCategories.length} categorieën zijn niet gekoppeld aan
              een budgettype
            </span>
            <div>
              <a
                href="/settings#categories"
                className="btn btn-sm btn-outline btn-warning"
              >
                Koppel categorieën
              </a>
            </div>
          </div>
        )}
      </div>

      <SummaryStats budgets={budgets} />

      <div className="card bg-base-100 shadow">
        <BudgetTable budgets={budgets} />
      </div>
    </div>
  );
}
