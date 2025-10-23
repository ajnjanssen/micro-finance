"use client";

import { useState, useEffect } from "react";
import AccountOverview from "@/components/AccountOverview";
import { FinancialData, Transaction } from "@/types/finance";

export default function RekeningenPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );
  const [accountBalances, setAccountBalances] = useState<{
    [accountId: string]: number;
  }>({});
  const [monthlyProjections, setMonthlyProjections] = useState<any[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [financeResponse, projectionsResponse] = await Promise.all([
        fetch("/api/finance"),
        fetch("/api/projections-v3?months=12"),
      ]);

      const data = await financeResponse.json();
      const projections = await projectionsResponse.json();

      setFinancialData(data);
      setMonthlyProjections(projections);

      // Calculate balances: starting balance + completed transactions
      const balances: { [accountId: string]: number } = {};
      data.accounts.forEach(
        (account: { id: string; startingBalance: number }) => {
          balances[account.id] = account.startingBalance || 0;
        }
      );

      // Add completed transactions to balances
      data.transactions
        .filter((tx: any) => tx.completed)
        .forEach((tx: any) => {
          if (balances[tx.accountId] !== undefined) {
            balances[tx.accountId] += tx.amount;
          }
        });

      setAccountBalances(balances);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total balance across all accounts
  const totalBalance = Object.values(accountBalances).reduce(
    (sum, balance) => sum + balance,
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + "-01");
    return date.toLocaleDateString("nl-NL", {
      month: "long",
      year: "numeric",
    });
  };

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  const handleCompleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(
        `/api/settings/transactions/${transactionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: true,
            completedDate: new Date().toISOString().split("T")[0],
          }),
        }
      );

      if (response.ok) {
        await loadData();
      } else {
        console.error("Failed to mark transaction as completed");
      }
    } catch (error) {
      console.error("Error completing transaction:", error);
    }
  };

  const findTransactionByDescription = (
    description: string,
    type: "income" | "expense",
    month: string
  ): Transaction | undefined => {
    if (!financialData) return undefined;

    // Parse month to check if transactions occur in this month
    const [year, monthNum] = month.split("-");
    const targetMonth = parseInt(monthNum) - 1; // 0-indexed

    return financialData.transactions.find((tx) => {
      if (tx.type !== type) return false;
      if (tx.description !== description) return false;

      // For recurring transactions, check if they occur in this month
      if (tx.isRecurring) {
        const txDate = new Date(tx.date);
        const txMonth = txDate.getMonth();

        if (tx.recurringType === "monthly") {
          return true; // Monthly occurs every month
        } else if (tx.recurringType === "yearly") {
          return txMonth === targetMonth; // Yearly only in specific month
        }
      }

      // For one-time transactions, check if date is in this month
      const txDate = new Date(tx.date);
      return (
        txDate.getFullYear() === parseInt(year) &&
        txDate.getMonth() === targetMonth
      );
    });
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
        <h1 className="text-3xl font-bold text-base-content mb-6">
          Rekeningen
        </h1>

        <AccountOverview
          accounts={financialData.accounts}
          totalBalance={totalBalance}
          accountBalances={accountBalances}
        />

        {/* Recurring Transactions Breakdown */}
        <div className="card p-6 mt-6">
          <h2 className="text-xl font-semibold text-base-content mb-4">
            Verwachte Terugkerende Transacties
          </h2>
          <p className="text-sm text-base-content/70 mb-4">
            Overzicht van terugkerende inkomsten en uitgaven per maand
          </p>

          <div className="space-y-3">
            {monthlyProjections.slice(0, 12).map((projection) => {
              const isExpanded = expandedMonths.has(projection.month);
              const hasIncome = projection.incomeBreakdown?.length > 0;
              const hasExpenses = projection.expenseBreakdown?.length > 0;

              const expectedIncome = projection.configuredIncome;
              const expectedExpenses = projection.configuredExpenses;
              const netChange = expectedIncome - expectedExpenses;

              return (
                <div
                  key={projection.month}
                  className="border border-base-300 rounded-lg"
                >
                  <button
                    onClick={() => toggleMonth(projection.month)}
                    className="w-full p-4 flex items-center justify-between hover:bg-base-200 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-medium text-base-content">
                        {formatMonth(projection.month)}
                      </span>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-success font-medium">
                            ↑ {formatCurrency(expectedIncome)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-error font-medium">
                            ↓ {formatCurrency(expectedExpenses)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`font-medium ${
                              netChange >= 0 ? "text-success" : "text-error"
                            }`}
                          >
                            = {formatCurrency(netChange)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 grid md:grid-cols-2 gap-4">
                      {/* Income Breakdown */}
                      {hasIncome && (
                        <div>
                          <h3 className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
                            <span>📈</span> Inkomsten
                          </h3>
                          <div className="space-y-1">
                            {projection.incomeBreakdown.map(
                              (item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-sm p-2 bg-success/5 rounded"
                                >
                                  <span className="text-base-content">
                                    {item.source}
                                  </span>
                                  <span className="font-medium text-success">
                                    {formatCurrency(item.amount)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t border-success/20">
                            <div className="flex justify-between text-sm font-semibold">
                              <span>Totaal Inkomsten</span>
                              <span className="text-success">
                                {formatCurrency(expectedIncome)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expense Breakdown */}
                      {hasExpenses && (
                        <div>
                          <h3 className="text-sm font-semibold text-error mb-2 flex items-center gap-2">
                            <span>📉</span> Uitgaven
                          </h3>
                          <div className="space-y-1">
                            {projection.expenseBreakdown.map(
                              (item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-sm p-2 bg-error/5 rounded"
                                >
                                  <span className="text-base-content">
                                    {item.name}
                                  </span>
                                  <span className="font-medium text-error">
                                    {formatCurrency(item.amount)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t border-error/20">
                            <div className="flex justify-between text-sm font-semibold">
                              <span>Totaal Uitgaven</span>
                              <span className="text-error">
                                {formatCurrency(expectedExpenses)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Net Result */}
                      <div className="md:col-span-2 mt-2 p-3 bg-primary/10 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base-content">
                            Netto Resultaat
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              netChange >= 0 ? "text-success" : "text-error"
                            }`}
                          >
                            {formatCurrency(netChange)}
                          </span>
                        </div>
                        <div className="text-xs text-base-content/70 mt-1">
                          Verwacht eindsaldo:{" "}
                          {formatCurrency(projection.projectedBalance)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
