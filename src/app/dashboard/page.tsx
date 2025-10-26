"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/components/dashboard";
import { FinancialData } from "@/types/finance";
import { PageLayout } from "@/components/PageLayout";

export default function DashboardPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );
  const [accountBalances, setAccountBalances] = useState<{
    [accountId: string]: number;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const response = await fetch("/api/finance");
      const data = await response.json();

      setFinancialData(data);

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
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total balance across all accounts
  const totalBalance = Object.values(accountBalances).reduce(
    (sum, balance) => sum + balance,
    0
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
      />
    </PageLayout>
  );
}
