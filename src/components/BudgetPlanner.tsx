"use client";

import { useState, useEffect } from "react";
import Select from "@/ui/foundation/select/Select";

interface BudgetItem {
  category: string;
  budgeted: number;
  spent: number;
  recommended: number;
  description: string;
  type?: string;
  isRecurring?: boolean;
}

export default function BudgetPlanner() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [savingsGoal, setSavingsGoal] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [unmappedCategories, setUnmappedCategories] = useState<string[]>([]);
  const [categoryMap, setCategoryMap] = useState<{ [key: string]: string }>({});
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  useEffect(() => {
    loadBudgetData();
  }, [savingsGoal, selectedMonth]);

  const loadBudgetData = async () => {
    try {
      const response = await fetch(
        `/api/finance/budget?savingsGoal=${savingsGoal}&month=${selectedMonth}`
      );
      const data = await response.json();
      setBudgets(data.budgets);
      setUnmappedCategories(data.unmappedCategories || []);
      setCategoryMap(data.categoryMap || {});
    } catch (error) {
      console.error("Error loading budget:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    // Last 6 months + current + next 3 months
    for (let i = -6; i <= 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const label = date.toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "long",
      });
      options.push({ value, label });
    }
    return options;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getProgressColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage <= 80) return "bg-success";
    if (percentage <= 100) return "bg-warning";
    return "bg-error";
  };

  const getProgressWidth = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    return Math.min(percentage, 100);
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-base-300 rounded w-1/4"></div>
          <div className="h-8 bg-base-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRecommended = budgets.reduce((sum, b) => sum + b.recommended, 0);
  const savingsGoalOptions = [
    { value: 500, label: "€500/maand (Conservatief)" },
    { value: 750, label: "€750/maand (Gemiddeld)" },
    { value: 1000, label: "€1.000/maand (Ambitieus)" },
    { value: 1250, label: "€1.250/maand (Agressief)" },
  ];

  const monthlyIncome = 2787.67;
  const studentDebt = 59.77;
  const availableForSpending = monthlyIncome - savingsGoal - studentDebt;

  // Separate fixed vs variable expenses
  const fixedBudgets = budgets.filter((b) => b.type === "fixed");
  const variableBudgets = budgets.filter((b) => b.type === "variable");

  const monthOptions = getMonthOptions();
  const selectedMonthLabel =
    monthOptions.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  return (
    <div className="space-y-6">
      {/* Unmapped Categories Alert */}
      {unmappedCategories.length > 0 && (
        <div className="alert bg-warning/10 shadow-lg border-l-warning border-l-10">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="font-bold">
                ⚠️ {unmappedCategories.length} Onbekende categorie
                {unmappedCategories.length > 1 ? "ën" : ""} gevonden
              </span>
            </div>
            <div className="ml-8 space-y-3">
              <p className="text-sm">
                Deze categorieën uit je transacties moeten toegewezen worden aan
                budget categorieën:
              </p>

              {unmappedCategories.map((cat: any) => (
                <div key={cat.category} className="card border p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="badge badge-lg badge-warning font-mono">
                        {cat.category}
                      </span>
                      <p className="text-xs mt-1 opacity-70">
                        {cat.count} transacties • €{cat.totalAmount.toFixed(2)}{" "}
                        totaal
                      </p>
                    </div>
                    <a
                      href={`/categorize?category=${encodeURIComponent(
                        cat.category
                      )}`}
                      className="btn btn-sm btn-primary"
                    >
                      Categoriseer →
                    </a>
                  </div>

                  {cat.examples && cat.examples.length > 0 && (
                    <div className="text-xs mb-2">
                      <span className="font-semibold">Voorbeelden:</span>
                      <ul className="list-disc list-inside ml-2 opacity-70">
                        {cat.examples.map((ex: string, i: number) => (
                          <li key={i}>{ex}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {cat.suggestions && cat.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1">
                        💡 Suggesties:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {cat.suggestions.map((suggestion: string) => (
                          <button
                            key={suggestion}
                            className="badge badge-sm badge-success cursor-pointer hover:badge-success-focus"
                            onClick={() => {
                              alert(
                                `Feature komt binnenkort: Wijs "${cat.category}" toe aan "${suggestion}"`
                              );
                            }}
                          >
                            → {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-semibold">
                  📋 Bekijk alle huidige mappings
                </summary>
                <div className="mt-2 bg-base-200 p-3 rounded text-xs grid grid-cols-2 gap-2">
                  {Object.entries(categoryMap).map(([from, to]) => (
                    <div key={from} className="flex gap-2 items-center">
                      <span className="font-mono badge badge-sm">{from}</span>
                      <span>→</span>
                      <span className="font-semibold">{to}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Savings Goal Card */}
      <div className="card bg-gradient-to-r from-success/10 to-primary/10 p-6 border border-success/20 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-base-content mb-4">
          💰 Spaar Doelstelling
        </h2>

        <div className="flex w-full gap-4">
          <div className="flex flex-col w-full bg-base-200 p-4 rounded-lg gap-4">
            <Select
              label="Maand"
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={monthOptions}
            />

            <Select
              label="Maandelijks Spaar Doel"
              value={savingsGoal}
              onChange={(value) => setSavingsGoal(parseInt(value))}
              options={savingsGoalOptions}
              labelClassName="label-text"
            />
          </div>

          <div className="card p-4 border border-primary/10 bg-base-200 w-full">
            <div className="text-sm text-base-content mb-1">
              Beschikbaar voor Uitgaven
            </div>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(availableForSpending)}
            </div>
            <div className="text-xs text-base-content mt-1">
              (€{monthlyIncome.toFixed(2)} inkomen - €{savingsGoal} sparen - €
              {studentDebt} studieschuld)
            </div>
          </div>
        </div>

        <div className="card p-4 border border-base-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-base-content">
              Voortgang {selectedMonthLabel}
            </span>
            <span className="text-sm text-base-content">
              {formatCurrency(totalSpent)} /{" "}
              {formatCurrency(availableForSpending)}
            </span>
          </div>
          <div className="w-full bg-base-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all ${
                totalSpent <= availableForSpending ? "bg-success" : "bg-error"
              }`}
              style={{
                width: `${Math.min(
                  (totalSpent / availableForSpending) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
          <div className="text-xs text-base-content mt-1">
            {totalSpent <= availableForSpending ? (
              <span className="text-success">
                ✅ Je zit op koers! Nog{" "}
                {formatCurrency(availableForSpending - totalSpent)} te besteden
              </span>
            ) : (
              <span className="text-error">
                ⚠️ Over budget:{" "}
                {formatCurrency(totalSpent - availableForSpending)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Recurring Expenses */}
      {fixedBudgets.length > 0 && (
        <div className="card bg-base-200 p-6 border-l-4 border-primary">
          <h2 className="text-xl font-semibold text-base-content mb-4">
            🔒 Vaste Lasten (Niet Aanpasbaar)
          </h2>
          <p className="text-sm text-base-content mb-4">
            Deze kosten zijn terugkerend en kunnen niet worden aangepast.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {fixedBudgets
              .sort((a, b) => b.spent - a.spent)
              .map((budget, index) => {
                const percentUsed =
                  budget.budgeted > 0
                    ? (budget.spent / budget.budgeted) * 100
                    : 0;

                return (
                  <div
                    key={index}
                    className="border border-primary/20 rounded-lg p-4 bg-primary/5"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-base-content capitalize">
                          {budget.category}
                        </h3>
                        <p className="text-xs text-base-content">
                          {budget.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-base-content">
                          {formatCurrency(budget.spent)}
                          <span className="text-base-content"> van </span>
                          {formatCurrency(budget.budgeted)}
                        </div>
                        <div className="text-xs text-base-content">
                          {percentUsed.toFixed(0)}% gebruikt
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(percentUsed, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Variable Expenses - Category Budgets */}
      <div className="card">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-base-content">
            📊 Variabele Uitgaven (Aanpasbaar)
          </h2>
          <div className="text-sm text-base-content">{selectedMonthLabel}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {variableBudgets
            .sort((a, b) => b.spent - a.spent)
            .map((budget, index) => {
              const isOverBudget = budget.spent > budget.budgeted;
              const percentUsed =
                budget.budgeted > 0
                  ? (budget.spent / budget.budgeted) * 100
                  : 0;

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    isOverBudget
                      ? "border-error/30 bg-error/5"
                      : "border-base-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-base-content capitalize">
                        {budget.category}
                        {isOverBudget && (
                          <span className="ml-2 text-xs text-error font-normal">
                            ⚠️ Over budget
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-base-content mt-1">
                        {budget.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-base-content">
                        {formatCurrency(budget.spent)}
                      </div>
                      <div className="text-xs text-base-content">
                        van {formatCurrency(budget.budgeted)}
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all ${getProgressColor(
                        budget.spent,
                        budget.budgeted
                      )}`}
                      style={{
                        width: `${getProgressWidth(
                          budget.spent,
                          budget.budgeted
                        )}%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-base-content">
                      {percentUsed.toFixed(0)}% gebruikt
                    </span>
                    <span
                      className={
                        budget.spent <= budget.budgeted
                          ? "text-success"
                          : "text-error"
                      }
                    >
                      {budget.spent <= budget.budgeted
                        ? `${formatCurrency(
                            budget.budgeted - budget.spent
                          )} resterend`
                        : `${formatCurrency(
                            budget.spent - budget.budgeted
                          )} overschrijding`}
                    </span>
                  </div>

                  {budget.recommended !== budget.budgeted && (
                    <div className="mt-2 pt-2 border-t border-base-300">
                      <div className="text-xs text-primary">
                        💡 Aanbevolen: {formatCurrency(budget.recommended)} om
                        je spaardoel te halen
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Summary Card */}
      <div className="card">
        <h2 className="text-xl font-semibold text-base-content mb-4">
          📈 Overzicht & Aanbevelingen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="text-sm text-primary font-medium">
              Huidig Budget
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalBudgeted)}
            </div>
          </div>

          <div className="bg-secondary/5 p-4 rounded-lg">
            <div className="text-sm text-secondary font-medium">
              Aanbevolen Budget
            </div>
            <div className="text-2xl font-bold text-secondary">
              {formatCurrency(totalRecommended)}
            </div>
          </div>

          <div className="bg-success/5 p-4 rounded-lg">
            <div className="text-sm text-success font-medium">
              Potentiële Besparing
            </div>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalBudgeted - totalRecommended)}
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-warning/5 border border-warning/20 rounded-lg">
          <h3 className="font-semibold text-warning mb-2">
            🎯 Belangrijkste Adviezen:
          </h3>
          <ul className="space-y-1 text-sm text-warning">
            {budgets
              .filter((b) => b.spent > b.recommended * 1.2)
              .slice(0, 3)
              .map((b, i) => (
                <li key={i}>
                  • Reduceer{" "}
                  <strong className="capitalize">{b.category}</strong> met{" "}
                  {formatCurrency(b.spent - b.recommended)} om je doel te
                  bereiken
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
