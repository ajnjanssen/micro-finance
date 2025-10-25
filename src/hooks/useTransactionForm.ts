import { useState } from "react";
import { Transaction } from "@/types/finance";

export function useTransactionForm() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const openNew = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  return { showForm, editingTransaction, openNew, openEdit, close };
}
