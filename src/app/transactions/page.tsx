"use client";

import { useFinancialData } from "@/hooks/useFinancialData";
import { useTransactionActions } from "@/hooks/useTransactionActions";
import { useTransactionForm } from "@/hooks/useTransactionForm";
import TransactionList from "@/components/TransactionList";
import TransactionFormCard from "@/components/transactions/TransactionFormCard";
import PageHeader from "@/components/ui/PageHeader";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";

export default function TransactionsPage() {
  const { financialData, loading, reload } = useFinancialData();
  const { handleAdd, handleUpdate, handleDelete, handleComplete } = useTransactionActions(reload);
  const { showForm, editingTransaction, openNew, openEdit, close } = useTransactionForm();

  const onSubmitTransaction = async (transaction: any) => {
    let success = false;
    if (editingTransaction) {
      success = await handleUpdate(editingTransaction.id, transaction);
    } else {
      success = await handleAdd(transaction);
    }
    if (success) close();
  };

  if (loading) return <LoadingState />;
  if (!financialData) return <ErrorState message="Kan financiële data niet laden" />;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader title="Transacties" buttonLabel="+ Nieuwe Transactie" onButtonClick={openNew} />

        {showForm && (
          <TransactionFormCard
            editingTransaction={editingTransaction}
            accounts={financialData.accounts}
            categories={financialData.categories}
            onSubmit={onSubmitTransaction}
            onCancel={close}
            onCategoryCreated={reload}
          />
        )}

        <TransactionList
          transactions={financialData.transactions}
          accounts={financialData.accounts}
          categories={financialData.categories}
          onEdit={openEdit}
          onDelete={handleDelete}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
