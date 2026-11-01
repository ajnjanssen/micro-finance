"use client";

import { useCallback, useEffect, useState } from "react";
import Dashboard from "@/components/dashboard";
import { PageLayout } from "@/components/PageLayout";
import { calculateAccountBalances } from "@/services/account-balance";
import type { FinancialData } from "@/types/finance";

export default function DashboardPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null,
  );
  const [accountBalances, setAccountBalances] = useState<{
    [accountId: string]: number;
  }>({});
  const [loading, setLoading] = useState(true);

  const loadFinancialData = useCallback(async () => {
    try {
      const response = await fetch("/api/finance");
      if (!response.ok) {
        throw new Error("Kan financiële data niet laden");
      }
      const data = await response.json();

      setFinancialData(data);

      setAccountBalances(
        calculateAccountBalances(data.accounts, data.transactions),
      );
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // Calculate total balance across all accounts
  const totalBalance = Object.values(accountBalances).reduce(
    (sum, balance) => sum + balance,
    0,
  );

  if (loading) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-base-300 rounded w-1/4"></div>
          <div className="h-64 bg-base-300 rounded"></div>
        </div>
      </PageLayout>
    );
  }

  if (!financialData) {
    return (
      <PageLayout>
        <div className="alert alert-error">
          <span>Kan financiële data niet laden</span>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="xl">
      <Dashboard
        currentBalance={totalBalance}
        accounts={financialData.accounts}
        accountBalances={accountBalances}
        onBalanceUpdate={loadFinancialData}
      />
    </PageLayout>
  );
}
