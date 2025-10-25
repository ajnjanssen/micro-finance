"use client";

import AccountOverview from "@/components/AccountOverview";
import RecurringTransactions from "@/components/RecurringTransactions";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useAccountBalances } from "@/hooks/useAccountBalances";
import { useProjections } from "@/hooks/useProjections";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";

export default function RekeningenPage() {
  const { financialData, loading } = useFinancialData();
  const { accountBalances, totalBalance } = useAccountBalances(financialData);
  const { projections, loading: projectionsLoading } = useProjections(12);

  if (loading) return <LoadingState />;
  if (!financialData) return <ErrorState message="Kan financiële data niet laden" />;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-base-content mb-6">Rekeningen</h1>

        <AccountOverview
          accounts={financialData.accounts}
          totalBalance={totalBalance}
          accountBalances={accountBalances}
        />

        {projectionsLoading ? (
          <div className="card p-6 mt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-base-300 rounded w-1/3" />
              <div className="h-4 bg-base-300 rounded w-1/4" />
            </div>
          </div>
        ) : (
          <RecurringTransactions 
            projections={projections} 
            accounts={financialData.accounts}
          />
        )}
      </div>
    </div>
  );
}
