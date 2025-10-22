"use client";

import { useState, useEffect, Fragment } from "react";
import { Transaction, Category } from "@/types/finance";
import Navigation from "@/components/Navigation";
import { convertToMonthly } from "@/types/financial-config";

interface CategorySpending {
  category: string;
  total: number;
  count: number;
  monthlyBreakdown: {
    month: string;
    amount: number;
    count: number;
  }[];
}

interface ConfiguredExpense {
  name: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  isActive: boolean;
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
}

export default function CategoriesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [configuredExpenses, setConfiguredExpenses] = useState<
    ConfiguredExpense[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>(
    []
  );
  const [sortBy, setSortBy] = useState<"total" | "count" | "name">("total");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewResults, setPreviewResults] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txRes, catRes, configRes] = await Promise.all([
        fetch("/api/settings/transactions"),
        fetch("/api/settings/categories"),
        fetch("/api/config"),
      ]);

      const txData = await txRes.json();
      const catData = await catRes.json();
      const configData = await configRes.json();

      // The API returns transactions directly as an array, not wrapped in an object
      const transactions = Array.isArray(txData)
        ? txData
        : txData.transactions || [];
      const categories = Array.isArray(catData)
        ? catData
        : catData.categories || [];
      const expenses = configData.recurringExpenses || [];

      setTransactions(transactions);
      setCategories(categories);
      setConfiguredExpenses(expenses);

      // Calculate spending by category
      calculateCategorySpending(transactions, expenses);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCategorySpending = (
    txs: Transaction[],
    configuredExpenses: ConfiguredExpense[]
  ) => {
    const spendingMap = new Map<
      string,
      {
        total: number;
        count: number;
        months: Map<string, { amount: number; count: number }>;
      }
    >();

    // First, add configured expenses as baseline (with count 0 to show they're configured)
    configuredExpenses
      .filter((exp) => exp.isActive)
      .forEach((expense) => {
        const category = expense.category || "uncategorized";
        const monthlyAmount = convertToMonthly(
          expense.amount,
          expense.frequency
        );

        if (!spendingMap.has(category)) {
          spendingMap.set(category, {
            total: monthlyAmount, // Include configured amount in total
            count: 0, // Count stays 0 to indicate no actual transactions
            months: new Map(),
          });
        } else {
          // Add to existing category
          const existing = spendingMap.get(category)!;
          existing.total += monthlyAmount;
        }
      });

    // Filter only expenses (negative amounts, or explicitly marked as expense)
    // Exclude income transactions (positive amount with type="income")
    const expenses = txs.filter((tx) => {
      // If explicitly marked as income, exclude it
      if (tx.type === "income") return false;
      // If explicitly marked as expense, include it
      if (tx.type === "expense") return true;
      // Otherwise, include if amount is negative (expense)
      return tx.amount < 0;
    });

    expenses.forEach((tx) => {
      const category = tx.category || "uncategorized";
      const month = tx.date.substring(0, 7); // YYYY-MM format
      const amount = Math.abs(tx.amount);

      if (!spendingMap.has(category)) {
        spendingMap.set(category, {
          total: 0,
          count: 0,
          months: new Map(),
        });
      }

      const catData = spendingMap.get(category)!;
      catData.total += amount;
      catData.count++;

      if (!catData.months.has(month)) {
        catData.months.set(month, { amount: 0, count: 0 });
      }

      const monthData = catData.months.get(month)!;
      monthData.amount += amount;
      monthData.count++;
    });

    // Convert to array format
    const spendingArray: CategorySpending[] = Array.from(
      spendingMap.entries()
    ).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      monthlyBreakdown: Array.from(data.months.entries())
        .map(([month, monthData]) => ({
          month,
          amount: monthData.amount,
          count: monthData.count,
        }))
        .sort((a, b) => b.month.localeCompare(a.month)), // Most recent first
    }));

    setCategorySpending(spendingArray);
  };

  const handleAutoCategorizePreviw = async () => {
    setIsAutoCategorizing(true);
    try {
      const response = await fetch("/api/settings/auto-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true }),
      });

      if (response.ok) {
        const results = await response.json();
        setPreviewResults(results);
        setShowPreview(true);
      } else {
        alert("Fout bij preview van auto-categorisatie");
      }
    } catch (error) {
      console.error("Error previewing auto-categorization:", error);
      alert("Fout bij preview van auto-categorisatie");
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const handleAutoCategorizeApply = async () => {
    if (
      !confirm(
        `Weet je zeker dat je ${previewResults?.categorizedCount} transacties automatisch wilt categoriseren?`
      )
    ) {
      return;
    }

    setIsAutoCategorizing(true);
    try {
      const response = await fetch("/api/settings/auto-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      });

      if (response.ok) {
        const results = await response.json();
        alert(
          `✅ ${results.categorizedCount} transacties succesvol gecategoriseerd!`
        );
        setShowPreview(false);
        setPreviewResults(null);
        loadData(); // Reload data
      } else {
        alert("Fout bij toepassen van auto-categorisatie");
      }
    } catch (error) {
      console.error("Error applying auto-categorization:", error);
      alert("Fout bij toepassen van auto-categorisatie");
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const sortedCategories = [...categorySpending].sort((a, b) => {
    if (sortBy === "total") return b.total - a.total;
    if (sortBy === "count") return b.count - a.count;
    return a.category.localeCompare(b.category);
  });

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + "-01");
    return date.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
  };

  const totalSpending = categorySpending.reduce(
    (sum, cat) => sum + cat.total,
    0
  );
  const totalTransactions = categorySpending.reduce(
    (sum, cat) => sum + cat.count,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="bg-base-100 border-b border-base-300 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto">
            <header className="px-4 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-primary">
                    Micro Finance
                  </h1>
                  <p className="text-base-content">
                    Beheer je financiën eenvoudig
                  </p>
                </div>
              </div>
            </header>
            <Navigation activeTab="categories" onTabChange={() => {}} />
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-base-300 rounded"></div>
            <div className="h-64 bg-base-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header with Navigation */}
      <div className="bg-base-100 border-b border-base-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <header className="px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-primary">
                  Micro Finance
                </h1>
                <p className="text-base-content">
                  Beheer je financiën eenvoudig
                </p>
              </div>
            </div>
          </header>
          <Navigation
            activeTab="categories"
            onTabChange={(tabId) => {
              if (tabId === "categories") return;
              if (tabId === "settings") {
                window.location.href = "/settings";
              } else {
                window.location.href = `/?tab=${tabId}`;
              }
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Uncategorized Alert */}
        {categorySpending.some((cat) => cat.category === "uncategorized") && (
          <div className="alert alert-warning shadow-lg">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
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
              <div>
                <h3 className="font-bold">
                  ⚠️ Je hebt ongecategoriseerde transacties
                </h3>
                <div className="text-xs">
                  {
                    categorySpending.find(
                      (cat) => cat.category === "uncategorized"
                    )?.count
                  }{" "}
                  transacties ter waarde van{" "}
                  {formatCurrency(
                    categorySpending.find(
                      (cat) => cat.category === "uncategorized"
                    )?.total || 0
                  )}{" "}
                  moeten worden gecategoriseerd voor betere inzichten.
                </div>
              </div>
            </div>
            <div className="flex-none gap-2">
              <button
                onClick={handleAutoCategorizePreviw}
                className="btn btn-sm btn-info"
                disabled={isAutoCategorizing}
              >
                {isAutoCategorizing ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "🤖"
                )}{" "}
                Auto-Categoriseer
              </button>
              <a
                href="/categorize?category=uncategorized"
                className="btn btn-sm btn-primary"
              >
                Handmatig →
              </a>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="text-sm text-base-content/70">Totale Uitgaven</h3>
              <p className="text-3xl font-bold text-error">
                {formatCurrency(totalSpending)}
              </p>
              <p className="text-xs text-base-content/50">Alle categorieën</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="text-sm text-base-content/70">
                Aantal Transacties
              </h3>
              <p className="text-3xl font-bold">{totalTransactions}</p>
              <p className="text-xs text-base-content/50">
                Uitgaven transacties
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="text-sm text-base-content/70">Categorieën</h3>
              <p className="text-3xl font-bold">{categorySpending.length}</p>
              <p className="text-xs text-base-content/50">Unieke categorieën</p>
            </div>
          </div>
        </div>

        {/* Empty State - No Transactions Yet */}
        {categorySpending.length === 0 && configuredExpenses.length === 0 && (
          <div className="card bg-base-100 shadow-xl border-2 border-dashed border-primary/30">
            <div className="card-body items-center text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="card-title text-2xl mb-2">
                Nog Geen Configuratie
              </h2>
              <p className="text-base-content/70 max-w-md mb-6">
                Je hebt nog geen uitgaven geconfigureerd. Ga door de onboarding
                om je vaste uitgaven in te stellen.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="/" className="btn btn-primary">
                  � Start Onboarding
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Info about configured categories */}
        {categorySpending.length > 0 && configuredExpenses.length > 0 && (
          <div className="alert bg-info/10 shadow-lg border-l-info border-l-4">
            <div className="flex items-start gap-2">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-bold">📋 Geconfigureerde Uitgaven</h3>
                <p className="text-sm mt-1">
                  Je hebt{" "}
                  <strong>
                    {configuredExpenses.filter((e) => e.isActive).length}{" "}
                    uitgaven
                  </strong>{" "}
                  geconfigureerd tijdens de onboarding. Deze categorieën worden
                  hieronder weergegeven. Zodra je transacties toevoegt, zie je
                  de daadwerkelijke uitgaven per categorie.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Categories Table */}
        {categorySpending.length > 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Uitgaven per Categorie</h2>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered select-sm"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "total" | "count" | "name")
                    }
                  >
                    <option value="total">Sorteer op Bedrag</option>
                    <option value="count">Sorteer op Aantal</option>
                    <option value="name">Sorteer op Naam</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Categorie</th>
                      <th className="text-right">Totaal Bedrag</th>
                      <th className="text-right">Aantal</th>
                      <th className="text-right">Gemiddeld</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCategories.map((cat) => {
                      const isExpanded = expandedCategory === cat.category;
                      const avgPerTransaction =
                        cat.count > 0 ? cat.total / cat.count : 0;
                      const isConfiguredOnly = cat.count === 0;
                      const configuredForCategory = configuredExpenses.filter(
                        (e) => e.isActive && e.category === cat.category
                      );
                      const configuredAmount = configuredForCategory.reduce(
                        (sum, e) => sum + e.amount,
                        0
                      );

                      return (
                        <Fragment key={cat.category}>
                          <tr
                            className={`hover cursor-pointer ${
                              cat.category === "uncategorized"
                                ? "bg-warning/10 border-l-4 border-warning"
                                : isConfiguredOnly
                                ? "bg-success/5 border-l-4 border-success"
                                : ""
                            }`}
                            onClick={() => toggleCategory(cat.category)}
                          >
                            <td>
                              <div className="flex items-center gap-2">
                                <svg
                                  className={`w-4 h-4 transition-transform ${
                                    isExpanded ? "rotate-90" : ""
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                                <span
                                  className={`badge badge-lg font-mono ${
                                    cat.category === "uncategorized"
                                      ? "badge-warning"
                                      : isConfiguredOnly
                                      ? "badge-success"
                                      : ""
                                  }`}
                                >
                                  {cat.category}
                                </span>
                                {cat.category === "uncategorized" && (
                                  <span className="text-xs text-warning">
                                    ⚠️ Actie vereist
                                  </span>
                                )}
                                {isConfiguredOnly && (
                                  <span className="text-xs text-error flex items-center gap-1">
                                    ⚙️ Geconfigureerd (
                                    {formatCurrency(configuredAmount)}/maand)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-right font-bold text-error">
                              {isConfiguredOnly ? (
                                <span className="text-error">
                                  {formatCurrency(configuredAmount)}/maand
                                </span>
                              ) : (
                                formatCurrency(cat.total)
                              )}
                            </td>
                            <td className="text-right">
                              {isConfiguredOnly ? (
                                <span className="text-base-content/50">
                                  {configuredForCategory.length} geconfigureerd
                                </span>
                              ) : (
                                cat.count
                              )}
                            </td>
                            <td className="text-right text-sm text-base-content/70">
                              {isConfiguredOnly ? (
                                <span className="text-base-content/50">-</span>
                              ) : (
                                formatCurrency(avgPerTransaction)
                              )}
                            </td>
                            <td className="text-right">
                              {isConfiguredOnly ? (
                                <a
                                  href="/settings?tab=configure"
                                  className="btn btn-xs btn-ghost"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Aanpassen →
                                </a>
                              ) : (
                                <a
                                  href={`/categorize?category=${encodeURIComponent(
                                    cat.category
                                  )}`}
                                  className="btn btn-xs btn-ghost"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Bekijk →
                                </a>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${cat.category}-details`}>
                              <td colSpan={5}>
                                <div className="p-4 bg-base-200 rounded-lg">
                                  {isConfiguredOnly ? (
                                    <>
                                      <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold">
                                          📋 Geconfigureerde Uitgaven
                                        </h4>
                                        <a
                                          href="/settings?tab=configure"
                                          className="btn btn-sm btn-primary"
                                        >
                                          ⚙️ Aanpassen
                                        </a>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="table table-sm w-full">
                                          <thead>
                                            <tr>
                                              <th>Naam</th>
                                              <th className="text-right">
                                                Bedrag
                                              </th>
                                              <th className="text-right">
                                                Dag van de Maand
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {configuredForCategory.map(
                                              (expense, idx) => (
                                                <tr key={idx}>
                                                  <td className="font-medium">
                                                    {expense.name}
                                                  </td>
                                                  <td className="text-right font-mono text-error">
                                                    {formatCurrency(
                                                      expense.amount
                                                    )}
                                                  </td>
                                                  <td className="text-right text-base-content/70">
                                                    {expense.dayOfMonth}e
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                      <div className="mt-3 p-3 bg-info/10 rounded text-sm">
                                        💡 Je geconfigureerde uitgaven worden
                                        hier weergegeven. Zodra je transacties
                                        toevoegt, zie je het daadwerkelijke
                                        bedrag dat je uitgeeft vergeleken met je
                                        configuratie.
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold">
                                          Maandelijkse Verdeling
                                        </h4>
                                        {cat.category === "uncategorized" && (
                                          <a
                                            href={`/categorize?category=uncategorized`}
                                            className="btn btn-sm btn-primary"
                                          >
                                            🏷️ Categoriseer Deze Transacties
                                          </a>
                                        )}
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="table table-sm w-full">
                                          <thead>
                                            <tr>
                                              <th>Maand</th>
                                              <th className="text-right">
                                                Bedrag
                                              </th>
                                              <th className="text-right">
                                                Aantal
                                              </th>
                                              <th className="text-right">
                                                Gemiddeld
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {cat.monthlyBreakdown.map(
                                              (month) => (
                                                <tr key={month.month}>
                                                  <td>
                                                    {formatMonth(month.month)}
                                                  </td>
                                                  <td className="text-right font-mono text-error">
                                                    {formatCurrency(
                                                      month.amount
                                                    )}
                                                  </td>
                                                  <td className="text-right">
                                                    {month.count}
                                                  </td>
                                                  <td className="text-right text-sm text-base-content/70">
                                                    {formatCurrency(
                                                      month.amount / month.count
                                                    )}
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                            <tr className="font-bold border-t-2">
                                              <td>Totaal</td>
                                              <td className="text-right text-error">
                                                {formatCurrency(cat.total)}
                                              </td>
                                              <td className="text-right">
                                                {cat.count}
                                              </td>
                                              <td className="text-right">
                                                {formatCurrency(
                                                  avgPerTransaction
                                                )}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {categorySpending.length === 0 && (
                <div className="text-center py-8 text-base-content/50">
                  <p>Geen uitgaven gevonden</p>
                  <a
                    href="/settings?tab=configure"
                    className="btn btn-primary btn-sm mt-4"
                  >
                    Bekijk Configuratie
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-Categorization Preview Modal */}
        {showPreview && previewResults && (
          <div className="modal modal-open">
            <div className="modal-box max-w-3xl">
              <h3 className="font-bold text-lg mb-4">
                🤖 Auto-Categorisatie Preview
              </h3>

              <div className="stats stats-vertical lg:stats-horizontal shadow mb-4 w-full">
                <div className="stat">
                  <div className="stat-title">Totaal Gecategoriseerd</div>
                  <div className="stat-value text-success">
                    {previewResults.categorizedCount}
                  </div>
                  <div className="stat-desc">alle transacties</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Hoge Zekerheid</div>
                  <div className="stat-value text-info">
                    {previewResults.categorizedCount -
                      (previewResults.lowConfidence || 0)}
                  </div>
                  <div className="stat-desc">goede match gevonden</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Lage Zekerheid</div>
                  <div className="stat-value text-warning">
                    {previewResults.lowConfidence || 0}
                  </div>
                  <div className="stat-desc">standaard categorie</div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">
                  Voorbeeld Categorisaties:
                </h4>
                <div className="alert alert-info text-sm mb-2">
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
                  <span>
                    <strong>Alle transacties worden gecategoriseerd:</strong>
                    <br />
                    • Grote uitgaven (€200+) zonder match → "onbekend" (voor
                    review)
                    <br />
                    • Kleine uitgaven zonder match → "Winkelen" (meest
                    voorkomend)
                    <br />• Alles met keyword match → specifieke categorie
                  </span>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="table table-zebra table-sm">
                    <thead>
                      <tr>
                        <th>Beschrijving</th>
                        <th className="text-right">Bedrag</th>
                        <th>Nieuwe Categorie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewResults.results?.map(
                        (result: any, idx: number) => (
                          <tr key={idx}>
                            <td className="text-sm">{result.description}</td>
                            <td className="text-right font-mono text-sm">
                              €{Math.abs(result.amount).toFixed(2)}
                            </td>
                            <td>
                              <span className="badge badge-success">
                                {result.newCategory}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
                {previewResults.categorizedCount > 30 && (
                  <p className="text-xs text-base-content/50 mt-2">
                    ... en {previewResults.categorizedCount - 30} meer
                    transacties
                  </p>
                )}
              </div>

              <div className="modal-action">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewResults(null);
                  }}
                  className="btn btn-ghost"
                  disabled={isAutoCategorizing}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAutoCategorizeApply}
                  className="btn btn-success"
                  disabled={isAutoCategorizing}
                >
                  {isAutoCategorizing ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "✅"
                  )}{" "}
                  Toepassen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
