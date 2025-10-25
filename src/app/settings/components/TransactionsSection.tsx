"use client";

import { useState } from "react";
import { Transaction, Category, Account } from "@/types/finance";
import { useTransactionHandlers } from "./hooks/useTransactionHandlers";
import SectionHeader from "./ui/SectionHeader";
import TransactionTable from "./tables/TransactionTable";
import TransactionForm from "./TransactionForm";

interface TransactionsSectionProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onUpdate: () => void;
}

export default function TransactionsSection({ transactions, categories, accounts, onUpdate }: TransactionsSectionProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { handleCreate, handleUpdate, handleDelete } = useTransactionHandlers(onUpdate, setIsCreating, setEditingTransaction);

  return (
    <div>
      <SectionHeader title="Transactions Management" buttonLabel="Add Transaction" onButtonClick={() => setIsCreating(true)} />
      <TransactionTable transactions={transactions} onEdit={setEditingTransaction} onDelete={handleDelete} />
      {(isCreating || editingTransaction) && (
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          accounts={accounts}
          onSave={isCreating ? handleCreate : handleUpdate}
          onCancel={() => { setIsCreating(false); setEditingTransaction(null); }}
        />
      )}
    </div>
  );
}
