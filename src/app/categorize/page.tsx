"use client";

import { useFinancialData } from "@/hooks/useFinancialData";
import { useAutoCategorization } from "@/hooks/useAutoCategorization";
import TransactionList from "@/components/TransactionList";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import PageHeader from "@/components/ui/PageHeader";

export default function CategorizePage() {
  const { financialData, loading, reload } = useFinancialData();
  const { results, preview, apply } = useAutoCategorization(reload);

  if (loading) return <LoadingState />;
  if (!financialData) return <ErrorState message="Kan financiële data niet laden" />;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader title="Categoriseren" buttonLabel="Auto-Categoriseren" onButtonClick={preview} />

        {results && (
          <div className="alert alert-info mb-4">
            <span>{results.changed} transacties kunnen worden gecategoriseerd</span>
            <button className="btn btn-sm btn-primary" onClick={apply}>Toepassen</button>
          </div>
        )}

        <TransactionList
          transactions={financialData.transactions}
          accounts={financialData.accounts}
          categories={financialData.categories}
          onEdit={() => {}}
          onDelete={async () => false}
          onComplete={async () => false}
        />
      </div>
    </div>
  );
}
