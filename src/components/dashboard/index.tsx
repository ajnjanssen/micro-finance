"use client";

import { useState } from "react";
import { useDashboardData } from "./hooks/useDashboardData";
import { BalanceCard } from "./BalanceCard";
import { ProjectionChart } from "./ProjectionChart";
import { MonthlyOverviewCard } from "./MonthlyOverviewCard";
import { MonthlyBreakdown } from "./MonthlyBreakdown";
import { ProjectionTable } from "./ProjectionTable";
import { KeyInsights } from "./KeyInsights";
import { SavingsBreakdown } from "./SavingsBreakdown";
import type { Account } from "@/types/finance";

interface DashboardProps {
  currentBalance: number;
  accounts: Account[];
  accountBalances: { [accountId: string]: number };
}

export default function Dashboard({
  currentBalance,
  accounts,
  accountBalances,
}: DashboardProps) {
  const [projectionMonths, setProjectionMonths] = useState(36);
  const {
    projections,
    monthlyProjections,
    monthlyOverview,
    categoryDetails,
    loading,
    reloadData,
  } = useDashboardData(projectionMonths);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-base-300 rounded w-1/4" />
          <div className="h-8 bg-base-300 rounded w-1/2" />
          <div className="space-y-3">
            <div className="h-4 bg-base-300 rounded" />
            <div className="h-4 bg-base-300 rounded w-5/6" />
            <div className="h-4 bg-base-300 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BalanceCard
        currentBalance={currentBalance}
        onBalanceUpdate={reloadData}
      />

      <MonthlyOverviewCard overview={monthlyOverview} />

      {/* Savings Breakdown */}
      {accounts.find((a) => a.type === "savings") && (
        <SavingsBreakdown
          savingsAccountBalance={
            accountBalances[
              accounts.find((a) => a.type === "savings")?.id || ""
            ] || 0
          }
          savingsAccountId={
            accounts.find((a) => a.type === "savings")?.id || ""
          }
        />
      )}

      <div className="card bg-base-100 shadow">
        <div className="card-body p-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">
                  Toekomstige Balans Projecties
                </h3>
                <div
                  className="tooltip tooltip-right"
                  data-tip="Dit toont hoe je totale vermogen zich ontwikkelt als je elke maand je terugkerende inkomsten ontvangt en uitgaven betaalt. Startsaldo + maandelijkse groei."
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-base-content/50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-base-content/60">
                Verwachte ontwikkeling van je <strong>totale vermogen</strong>{" "}
                (alle rekeningen samen) op basis van terugkerende transacties
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-base-content">Periode:</label>
              <select
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(Number(e.target.value))}
                className="select select-bordered "
              >
                <option value={12}>1 jaar</option>
                <option value={24}>2 jaar</option>
                <option value={36}>3 jaar</option>
                <option value={60}>5 jaar</option>
              </select>
            </div>
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
            <span>
              <strong>De grafiek toont:</strong> Je huidige saldo (€
              {currentBalance.toFixed(2)}) + de maandelijkse groei van €
              {monthlyOverview?.netAmount.toFixed(2) || "0.00"} = verwacht
              toekomstig vermogen
            </span>
          </div>
        </div>
      </div>

      <ProjectionChart projections={projections} accounts={accounts} />

      <MonthlyBreakdown
        projections={projections}
        currentBalance={currentBalance}
      />

      <ProjectionTable
        projections={projections}
        currentBalance={currentBalance}
      />

      <KeyInsights
        projections={projections}
        monthlyOverview={monthlyOverview}
        projectionMonths={projectionMonths}
        currentBalance={currentBalance}
      />
    </div>
  );
}
