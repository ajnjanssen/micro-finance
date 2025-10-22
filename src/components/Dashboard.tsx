"use client";

import { useState, useEffect } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  BalanceProjection,
  MonthlyOverview,
  Transaction,
} from "@/types/finance";

interface DashboardProps {
  currentBalance: number;
}

interface CategoryDetail {
  actual: Transaction[];
  projected: Array<{
    description: string;
    amount: number;
    isProjected: true;
  }>;
}

export default function Dashboard({ currentBalance }: DashboardProps) {
  const [projections, setProjections] = useState<BalanceProjection[]>([]);
  const [monthlyOverview, setMonthlyOverview] =
    useState<MonthlyOverview | null>(null);
  const [categoryDetails, setCategoryDetails] = useState<{
    [category: string]: CategoryDetail;
  }>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [projectionMonths, setProjectionMonths] = useState(36);
  const [loading, setLoading] = useState(true);

  const loadProjections = async () => {
    try {
      const response = await fetch(
        `/api/projections-v3?months=${projectionMonths}`
      );
      const monthlyProjections = await response.json();

      // Debug: Check November's income breakdown
      const novProj = monthlyProjections.find((p: any) => p.month === '2025-11');
      const decProj = monthlyProjections.find((p: any) => p.month === '2025-12');
      console.log('[Dashboard] November incomeBreakdown:', novProj?.incomeBreakdown);
      console.log('[Dashboard] December incomeBreakdown:', decProj?.incomeBreakdown);

      // Transform MonthlyProjection[] to BalanceProjection[]
      const balanceProjections: BalanceProjection[] = monthlyProjections.map(
        (p: any) => ({
          date: p.month + "-01", // YYYY-MM-01 format
          totalBalance: p.projectedBalance,
          accountBalances: {}, // Not needed for now
        })
      );

      setProjections(balanceProjections);
    } catch (error) {
      console.error("Error loading projections:", error);
    }
  };

  const loadMonthlyOverview = async () => {
    try {
      const response = await fetch("/api/overview-v3");
      const data = await response.json();

      // Transform v3 data to match the expected MonthlyOverview format
      const today = new Date();
      const monthStr = today.toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "2-digit",
      });

      setMonthlyOverview({
        month: monthStr,
        totalIncome: data.configuredIncome,
        totalExpenses: data.configuredExpenses,
        netAmount: data.configuredNet,
        topCategories: [], // We can populate this later if needed
        actualIncome: data.actualIncome,
        actualExpenses: data.actualExpenses,
        projectedIncome: data.remainingIncome,
        projectedExpenses: data.remainingExpenses,
      });
    } catch (error) {
      console.error("Error loading monthly overview:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadProjections(), loadMonthlyOverview()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Reload projections when period changes
  useEffect(() => {
    loadProjections();
  }, [projectionMonths]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Parse YYYY-MM-DD format manually to avoid timezone issues
    const [year, month] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
    return date.toLocaleDateString("nl-NL", {
      month: "short",
      year: "numeric",
    });
  };

  const getBalanceColor = (balance: number) => {
    if (balance > currentBalance * 1.1) return "text-success";
    if (balance < currentBalance * 0.9) return "text-error";
    return "text-base-content";
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-base-300 rounded w-1/4"></div>
          <div className="h-8 bg-base-300 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-base-300 rounded"></div>
            <div className="h-4 bg-base-300 rounded w-5/6"></div>
            <div className="h-4 bg-base-300 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Month Overview */}
      {monthlyOverview && (
        <div className="card">
          <h2 className="text-xl font-semibold text-base-content mb-4">
            Deze Maand ({monthlyOverview.month})
          </h2>
          {/* Show actual vs projected if data available */}
          {monthlyOverview.actualIncome !== undefined && (
            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-primary font-medium mb-1">
                    Tot nu toe (daadwerkelijk)
                  </div>
                  <div className="text-success">
                    Inkomsten: {formatCurrency(monthlyOverview.actualIncome)}
                  </div>
                  <div className="text-error">
                    Uitgaven:{" "}
                    {formatCurrency(monthlyOverview.actualExpenses || 0)}
                  </div>
                  <div
                    className={`font-semibold ${
                      monthlyOverview.actualIncome -
                        (monthlyOverview.actualExpenses || 0) >=
                      0
                        ? "text-success"
                        : "text-error"
                    }`}
                  >
                    Netto:{" "}
                    {formatCurrency(
                      monthlyOverview.actualIncome -
                        (monthlyOverview.actualExpenses || 0)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-primary font-medium mb-1">
                    Verwacht (met projecties)
                  </div>
                  <div className="text-success">
                    + {formatCurrency(monthlyOverview.projectedIncome || 0)}{" "}
                    gepland
                  </div>
                  <div className="text-error">
                    + {formatCurrency(monthlyOverview.projectedExpenses || 0)}{" "}
                    gepland
                  </div>
                  <div className="text-primary font-semibold">
                    Verwacht einde maand:{" "}
                    {formatCurrency(monthlyOverview.netAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-success/5 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-success">
                Totale Inkomsten
              </h3>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(monthlyOverview.totalIncome)}
              </p>
            </div>

            <div className="bg-error/5 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-error">
                Totale Uitgaven
              </h3>
              <p className="text-2xl font-bold text-error">
                {formatCurrency(monthlyOverview.totalExpenses)}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                monthlyOverview.netAmount >= 0 ? "bg-primary/5" : "bg-warning/5"
              }`}
            >
              <h3
                className={`text-sm font-medium ${
                  monthlyOverview.netAmount >= 0
                    ? "text-primary"
                    : "text-warning"
                }`}
              >
                Netto Resultaat
              </h3>
              <p
                className={`text-2xl font-bold ${
                  monthlyOverview.netAmount >= 0
                    ? "text-primary"
                    : "text-warning"
                }`}
              >
                {formatCurrency(monthlyOverview.netAmount)}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-base-content">
              Balans Projecties
            </h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-base-content w-fit">
                Projectie periode:
              </label>
              <select
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(parseInt(e.target.value))}
                className="select select-ghost"
              >
                <option value={12}>1 jaar</option>
                <option value={24}>2 jaar</option>
                <option value={36}>3 jaar</option>
                <option value={60}>5 jaar</option>
              </select>
            </div>
          </div>
          <div className="card">
            <div className="flex gap-4 w-full">
              {/* Balance Projection Chart */}
              {projections.length > 0 && (
                <div className="mt-6 w-full">
                  <div
                    className="card line-chart-card"
                    style={{ width: "100%", height: 300 }}
                  >
                    <LineChart
                      xAxis={[
                        {
                          data: projections.map((p) => formatDate(p.date)),
                          scaleType: "point",
                        },
                      ]}
                      yAxis={[
                        {
                          valueFormatter: (value: number) =>
                            `€${(value / 1000).toFixed(0)}k`,
                        },
                      ]}
                      series={[
                        {
                          data: projections.map((p) => p.totalBalance),
                          color: "#3b82f6",
                          showMark: true,
                        },
                      ]}
                      height={300}
                      grid={{ vertical: true, horizontal: true }}
                    />
                  </div>
                </div>
              )}

              {projections.length > 6 && (
                <div className="mt-6 w-full bg-base-200 p-4 rounded-lg border-l-10 border-primary/20">
                  <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th className="text-base-content">Datum</th>
                          <th className="text-base-content">Totaal Saldo</th>
                          <th className="text-base-content">Verschil</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projections
                          .filter((_, index) => index % 12 === 0)
                          .map((projection, index) => (
                            <tr key={index}>
                              <td className="text-base-content">
                                {formatDate(projection.date)}
                              </td>
                              <td className="font-medium">
                                <span
                                  className={getBalanceColor(
                                    projection.totalBalance
                                  )}
                                >
                                  {formatCurrency(projection.totalBalance)}
                                </span>
                              </td>
                              <td>
                                {projection.totalBalance > currentBalance ? (
                                  <span className="text-success">
                                    +
                                    {formatCurrency(
                                      projection.totalBalance - currentBalance
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-error">
                                    {formatCurrency(
                                      projection.totalBalance - currentBalance
                                    )}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <h3 className="text-sm font-semibold text-base-content mb-3">
              Toekomstige Maanden
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-base-200 rounded-lg border-l-10 border-primary/20">
              {projections.slice(1, 7).map((projection, index) => {
                // Start from index 1 (next month) to show actual monthly changes
                // Compare to previous month's projection
                const previousBalance = projections[index].totalBalance; // index because we sliced from 1
                const monthlyChange = projection.totalBalance - previousBalance;

                return (
                  <div
                    key={index}
                    className="border border-success/10 rounded-lg p-4 bg-base-300"
                  >
                    <h4 className="text-sm font-medium text-base-content mb-1">
                      {formatDate(projection.date)}
                    </h4>
                    <p
                      className={`text-xl font-bold ${getBalanceColor(
                        projection.totalBalance
                      )}`}
                    >
                      {formatCurrency(projection.totalBalance)}
                    </p>
                    <div className="mt-2 text-xs text-base-content">
                      {monthlyChange >= 0 ? (
                        <span className="text-success">
                          +{formatCurrency(monthlyChange)} groei
                        </span>
                      ) : (
                        <span className="text-error">
                          {formatCurrency(monthlyChange)} verlies
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {monthlyOverview?.topCategories?.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-base-content mb-3">
                Top Uitgaven Categorieën
              </h3>
              <div className="space-y-2">
                {monthlyOverview.topCategories.map((cat, index) => {
                  const isExpanded = expandedCategories.has(cat.category);
                  const details = categoryDetails[cat.category];

                  return (
                    <div
                      key={index}
                      className="border border-base-300 rounded-lg overflow-hidden"
                    >
                      <div
                        className="flex justify-between items-center p-3 bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
                        onClick={() => toggleCategory(cat.category)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg
                            className={`w-4 h-4 text-base-content transition-transform ${
                              isExpanded ? "transform rotate-90" : ""
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
                          <span className="font-medium text-base-content">
                            {cat.category}
                          </span>
                        </div>
                        <span className="text-error font-semibold my-auto bg-base-200 px-2 py-1 rounded-full">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>

                      {isExpanded && details && (
                        <div className="p-3 bg-base-300 border-t border-base-300">
                          {/* Actual transactions */}
                          {details.actual.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold text-base-content mb-2 uppercase">
                                Daadwerkelijke Transacties
                              </h4>
                              <div className="space-y-1">
                                {details.actual.map((tx, txIndex) => (
                                  <div
                                    key={txIndex}
                                    className="flex justify-between items-start text-sm py-1 px-2 bg-primary rounded"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-primary-content">
                                        {tx.description}
                                      </div>
                                      <div className="text-xs text-base-content">
                                        {new Date(tx.date).toLocaleDateString(
                                          "nl-NL"
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-error ml-2 bg-base-200 px-2 py-1 rounded-full my-auto">
                                      {formatCurrency(Math.abs(tx.amount))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Projected transactions */}
                          {details.projected.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-base-content mb-2 uppercase">
                                Verwachte Transacties
                              </h4>
                              <div className="space-y-1">
                                {details.projected.map((proj, projIndex) => (
                                  <div
                                    key={projIndex}
                                    className="flex justify-between items-start text-sm py-1 px-2 border bg-secondary/5 border-secondary/10 rounded"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-secondary">
                                        {proj.description}
                                      </div>
                                      <div className="text-xs text-primary italic">
                                        Projectie (nog niet betaald)
                                      </div>
                                    </div>
                                    <span className="text-error font-medium ml-2 my-auto bg-base-200 px-2 py-1 rounded-full">
                                      {formatCurrency(Math.abs(proj.amount))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Insights */}
      <div className="card p-4 bg-base-200 rounded-lg border-l-10 border-primary/20">
        <h2 className="text-xl font-semibold text-base-content mb-4">
          Belangrijke Inzichten
        </h2>

        <div className="space-y-3">
          {projections.length > 0 && (
            <>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span className="text-base-content">
                  In {projectionMonths} maanden verwacht saldo:{" "}
                  <span
                    className={`font-semibold ${getBalanceColor(
                      projections[projections.length - 1]?.totalBalance || 0
                    )}`}
                  >
                    {formatCurrency(
                      projections[projections.length - 1]?.totalBalance || 0
                    )}
                  </span>
                </span>
              </div>

              {monthlyOverview && (
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  <span className="text-base-content">
                    Gemiddeld maandelijks resultaat:{" "}
                    <span
                      className={`font-semibold ${
                        monthlyOverview.netAmount >= 0
                          ? "text-success"
                          : "text-error"
                      }`}
                    >
                      {formatCurrency(monthlyOverview.netAmount)}
                    </span>
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-warning rounded-full"></span>
                <span className="text-base-content">
                  Projecties zijn gebaseerd op terugkerende transacties en
                  huidige balansen
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
