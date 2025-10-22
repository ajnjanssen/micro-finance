"use client";

import { useState, useEffect } from "react";

interface BudgetBreakdown {
  needs: {
    budgeted: number;
    spent: number;
    items: Array<{ name: string; amount: number; category: string }>;
  };
  wants: {
    budgeted: number;
    spent: number;
    items: Array<{ name: string; amount: number; category: string }>;
  };
  savings: {
    budgeted: number;
    spent: number;
    items: Array<{ name: string; amount: number; category: string }>;
  };
  totalIncome: number;
}

export default function Budget503020() {
  const [breakdown, setBreakdown] = useState<BudgetBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetBreakdown();
  }, []);

  const loadBudgetBreakdown = async () => {
    try {
      // Load configured income, expenses, AND recurring transactions
      const [incomeRes, expensesRes, transactionsRes] = await Promise.all([
        fetch("/api/config/income"),
        fetch("/api/config/expenses"),
        fetch("/api/finance"),
      ]);

      const income = await incomeRes.json();
      const expenses = await expensesRes.json();
      const financialData = await transactionsRes.json();

      // Get recurring transactions
      const recurringTransactions = (financialData.transactions || []).filter(
        (t: any) => t.isRecurring && t.type === "expense"
      );

      // Calculate total monthly income (configured + recurring)
      const configuredIncome = income
        .filter((s: any) => s.isActive)
        .reduce((sum: number, s: any) => sum + s.amount, 0);

      // Only include recurring income that occurs THIS month
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const recurringIncome = (financialData.transactions || [])
        .filter((t: any) => {
          if (!t.isRecurring || t.type !== "income") return false;

          // For yearly transactions, only include if it's the correct month
          if (t.recurringType === "yearly") {
            const txDate = new Date(t.date);
            const txMonth = txDate.getMonth();
            return txMonth === currentMonth;
          }

          // For monthly/quarterly/etc, include them
          // (You may want to add more specific logic for quarterly later)
          return true;
        })
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

      const totalIncome = configuredIncome + recurringIncome;

      // Calculate 50/30/20 targets
      const needsTarget = totalIncome * 0.5;
      const wantsTarget = totalIncome * 0.3;
      const savingsTarget = totalIncome * 0.2;

      // Categorize configured expenses
      const needs = expenses.filter(
        (e: any) => e.isActive && e.budgetType === "needs"
      );
      const wants = expenses.filter(
        (e: any) => e.isActive && e.budgetType === "wants"
      );
      const savings = expenses.filter(
        (e: any) => e.isActive && e.budgetType === "savings"
      );

      // For uncategorized configured expenses, use isEssential as fallback
      const uncategorized = expenses.filter(
        (e: any) => e.isActive && !e.budgetType
      );
      uncategorized.forEach((e: any) => {
        if (e.isEssential) {
          needs.push(e);
        } else {
          wants.push(e);
        }
      });

      // Categorize recurring transactions
      const recurringExpenses = (financialData.transactions || []).filter(
        (t: any) => t.isRecurring && t.type === "expense"
      );

      // Get categories to check if transaction is savings-related
      const categories = financialData.categories || [];

      // Add recurring expenses to appropriate buckets
      for (const transaction of recurringExpenses) {
        const txAmount = Math.abs(transaction.amount);
        const txItem = {
          name: transaction.description,
          amount: txAmount,
          category: transaction.category || "Onbekend",
        };

        // Check category name to determine bucket
        const category = categories.find(
          (c: any) => c.id === transaction.category
        );
        const categoryName = category?.name?.toLowerCase() || "";

        // Savings categories
        if (
          categoryName.includes("spar") ||
          categoryName.includes("saving") ||
          categoryName.includes("besparing")
        ) {
          savings.push(txItem);
        }
        // Lifestyle/Wants categories
        else if (
          categoryName.includes("boodschappen") ||
          categoryName.includes("groceries") ||
          categoryName.includes("food") ||
          categoryName.includes("eten") ||
          categoryName.includes("restaurant") ||
          categoryName.includes("entertainment") ||
          categoryName.includes("hobby") ||
          categoryName.includes("sport") ||
          categoryName.includes("vakantie") ||
          categoryName.includes("holiday")
        ) {
          wants.push(txItem);
        }
        // Default to needs for essential expenses
        else {
          needs.push(txItem);
        }
      }

      const needsTotal = needs.reduce(
        (sum: number, e: any) => sum + e.amount,
        0
      );
      const wantsTotal = wants.reduce(
        (sum: number, e: any) => sum + e.amount,
        0
      );
      const savingsTotal = savings.reduce(
        (sum: number, e: any) => sum + e.amount,
        0
      );

      setBreakdown({
        needs: {
          budgeted: needsTarget,
          spent: needsTotal,
          items: needs.map((e: any) => ({
            name: e.name,
            amount: e.amount,
            category: e.category,
          })),
        },
        wants: {
          budgeted: wantsTarget,
          spent: wantsTotal,
          items: wants.map((e: any) => ({
            name: e.name,
            amount: e.amount,
            category: e.category,
          })),
        },
        savings: {
          budgeted: savingsTarget,
          spent: savingsTotal,
          items: savings.map((e: any) => ({
            name: e.name,
            amount: e.amount,
            category: e.category,
          })),
        },
        totalIncome,
      });
    } catch (error) {
      console.error("Error loading budget breakdown:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getPercentage = (spent: number, budgeted: number) => {
    if (budgeted === 0) return 0;
    return Math.round((spent / budgeted) * 100);
  };

  const getStatusColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage <= 90) return "success";
    if (percentage <= 100) return "warning";
    return "error";
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

  if (!breakdown) {
    return (
      <div className="card p-6">
        <p className="text-base-content/70">Geen budget data beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 50% Needs */}
        <div className="card bg-base-100 shadow-xl border-l-4 border-error">
          <div className="card-body">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold">50% Essentieel</h3>
                <p className="text-xs text-base-content/70">Vaste lasten</p>
              </div>
              <div className="badge badge-lg badge-error">NEEDS</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget:</span>
                <span className="font-semibold">
                  {formatCurrency(breakdown.needs.budgeted)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Gepland:</span>
                <span className="font-semibold">
                  {formatCurrency(breakdown.needs.spent)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Beschikbaar:</span>
                <span
                  className={
                    breakdown.needs.budgeted - breakdown.needs.spent >= 0
                      ? "text-success"
                      : "text-error"
                  }
                >
                  {formatCurrency(
                    breakdown.needs.budgeted - breakdown.needs.spent
                  )}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>
                  {getPercentage(
                    breakdown.needs.spent,
                    breakdown.needs.budgeted
                  )}
                  % gebruikt
                </span>
              </div>
              <progress
                className={`progress progress-${getStatusColor(
                  breakdown.needs.spent,
                  breakdown.needs.budgeted
                )} w-full`}
                value={breakdown.needs.spent}
                max={breakdown.needs.budgeted}
              ></progress>
            </div>

            <details className="mt-4" open>
              <summary className="cursor-pointer text-sm font-semibold">
                {breakdown.needs.items.length} uitgaven
              </summary>
              <ul className="mt-2 space-y-1 text-sm max-h-64 overflow-y-auto">
                {breakdown.needs.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-mono">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>

        {/* 30% Wants */}
        <div className="card bg-base-100 shadow-xl border-l-4 border-warning">
          <div className="card-body">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold">30% Levensstijl</h3>
                <p className="text-xs text-base-content/70">Niet essentieel</p>
              </div>
              <div className="badge badge-lg badge-warning">WANTS</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget:</span>
                <span className="font-semibold">
                  {formatCurrency(breakdown.wants.budgeted)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Gepland:</span>
                <span className="font-semibold">
                  {formatCurrency(breakdown.wants.spent)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Beschikbaar:</span>
                <span
                  className={
                    breakdown.wants.budgeted - breakdown.wants.spent >= 0
                      ? "text-success"
                      : "text-error"
                  }
                >
                  {formatCurrency(
                    breakdown.wants.budgeted - breakdown.wants.spent
                  )}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>
                  {getPercentage(
                    breakdown.wants.spent,
                    breakdown.wants.budgeted
                  )}
                  % gebruikt
                </span>
              </div>
              <progress
                className={`progress progress-${getStatusColor(
                  breakdown.wants.spent,
                  breakdown.wants.budgeted
                )} w-full`}
                value={breakdown.wants.spent}
                max={breakdown.wants.budgeted}
              ></progress>
            </div>

            <details className="mt-4" open>
              <summary className="cursor-pointer text-sm font-semibold">
                {breakdown.wants.items.length} uitgaven
              </summary>
              <ul className="mt-2 space-y-1 text-sm max-h-64 overflow-y-auto">
                {breakdown.wants.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-mono">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>

        {/* 20% Savings */}
        <div className="card bg-base-100 shadow-xl border-l-4 border-success">
          <div className="card-body">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold">20% Sparen</h3>
                <p className="text-xs text-base-content/70">
                  Toekomst & schulden
                </p>
              </div>
              <div className="badge badge-lg badge-success">SAVINGS</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Doel:</span>
                <span className="font-semibold">
                  {formatCurrency(breakdown.savings.budgeted)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Gepland:</span>
                <span className="font-semibold">
                  {formatCurrency(breakdown.savings.spent)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Te gaan:</span>
                <span
                  className={
                    breakdown.savings.spent >= breakdown.savings.budgeted
                      ? "text-success"
                      : "text-warning"
                  }
                >
                  {formatCurrency(
                    breakdown.savings.budgeted - breakdown.savings.spent
                  )}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>
                  {getPercentage(
                    breakdown.savings.spent,
                    breakdown.savings.budgeted
                  )}
                  % bereikt
                </span>
              </div>
              <progress
                className={`progress progress-success w-full`}
                value={breakdown.savings.spent}
                max={breakdown.savings.budgeted}
              ></progress>
            </div>

            <details className="mt-4" open>
              <summary className="cursor-pointer text-sm font-semibold">
                {breakdown.savings.items.length} bijdragen
              </summary>
              <ul className="mt-2 space-y-1 text-sm max-h-64 overflow-y-auto">
                {breakdown.savings.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-mono">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </div>

      {/* Summary Info */}
      <div className="card bg-info/10 border border-info/30">
        <div className="card-body">
          <h3 className="font-bold text-lg mb-4">📊 50/30/20 Budget Regel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-2">De Regel:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>
                  <strong>50% Essentieel:</strong> Huur, utilities,
                  verzekeringen, boodschappen
                </li>
                <li>
                  <strong>30% Levensstijl:</strong> Restaurants, entertainment,
                  hobbies
                </li>
                <li>
                  <strong>20% Sparen:</strong> Noodfonds, investeringen,
                  schulden aflossen
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Jouw Verdeling:</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Maandelijks Inkomen:</span>
                  <span className="font-bold">
                    {formatCurrency(breakdown.totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Totaal Gepland: </span>
                  <span
                    className={`font-bold ${
                      breakdown.needs.spent +
                        breakdown.wants.spent +
                        breakdown.savings.spent >
                      breakdown.totalIncome
                        ? "text-error"
                        : "text-success"
                    }`}
                  >
                    {formatCurrency(
                      breakdown.needs.spent +
                        breakdown.wants.spent +
                        breakdown.savings.spent
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Overgebleven:</span>
                  <span
                    className={`font-bold ${
                      breakdown.totalIncome -
                        (breakdown.needs.spent +
                          breakdown.wants.spent +
                          breakdown.savings.spent) >=
                      0
                        ? "text-success"
                        : "text-error"
                    }`}
                  >
                    {formatCurrency(
                      breakdown.totalIncome -
                        (breakdown.needs.spent +
                          breakdown.wants.spent +
                          breakdown.savings.spent)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <a
              href="/settings?tab=configure"
              className="btn btn-sm btn-primary"
            >
              ⚙️ Pas Budget Types Aan
            </a>
          </div>
        </div>
      </div>

      {/* Savings Growth Chart */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="font-bold text-lg mb-4">💰 Spaargroei Projectie</h3>

          <div className="space-y-4">
            {/* Visual Chart */}
            <div className="w-full h-64 flex items-end gap-2">
              {[1, 3, 6, 12, 24, 36].map((months) => {
                const totalSaved = breakdown.savings.spent * months;
                const maxSaving = breakdown.savings.spent * 36;
                const heightPercentage = (totalSaved / maxSaving) * 100;

                return (
                  <div
                    key={months}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="text-xs font-semibold text-success">
                      {formatCurrency(totalSaved)}
                    </div>
                    <div
                      className="w-full bg-success rounded-t-lg transition-all duration-500 hover:bg-success/80"
                      style={{ height: `${heightPercentage}%` }}
                      title={`${months} maanden: ${formatCurrency(totalSaved)}`}
                    ></div>
                    <div className="text-xs font-semibold text-base-content/70">
                      {months}m
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats Table */}
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Periode</th>
                    <th className="text-right">Totaal Gespaard</th>
                    <th className="text-right">% van Inkomen</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { months: 1, label: "1 maand" },
                    { months: 3, label: "3 maanden" },
                    { months: 6, label: "6 maanden" },
                    { months: 12, label: "1 jaar" },
                    { months: 24, label: "2 jaar" },
                    { months: 36, label: "3 jaar" },
                  ].map(({ months, label }) => {
                    const totalSaved = breakdown.savings.spent * months;
                    const totalIncome = breakdown.totalIncome * months;
                    const percentage = (
                      (totalSaved / totalIncome) *
                      100
                    ).toFixed(1);

                    return (
                      <tr key={months}>
                        <td>{label}</td>
                        <td className="text-right font-mono font-semibold text-success">
                          {formatCurrency(totalSaved)}
                        </td>
                        <td className="text-right">
                          <span className="badge badge-sm badge-success">
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div className="text-xs">
                <p>
                  Met een maandelijks spaarbedrag van{" "}
                  <strong>{formatCurrency(breakdown.savings.spent)}</strong>,
                  bouw je in 3 jaar een spaarpotje op van{" "}
                  <strong>
                    {formatCurrency(breakdown.savings.spent * 36)}
                  </strong>
                  .
                </p>
                <p className="mt-1">
                  Dit is{" "}
                  <strong>
                    {(
                      (breakdown.savings.spent / breakdown.totalIncome) *
                      100
                    ).toFixed(1)}
                    %
                  </strong>{" "}
                  van je maandinkomen. Het 50/30/20 doel is 20% (€
                  {formatCurrency(breakdown.savings.budgeted)}/maand).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
