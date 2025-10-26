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
import { NetWorthCard } from "./NetWorthCard";
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BalanceCard
          currentBalance={currentBalance}
          onBalanceUpdate={reloadData}
        />
        <NetWorthCard />
      </div>

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

      <ProjectionChart
        projections={projections}
        accounts={accounts}
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
