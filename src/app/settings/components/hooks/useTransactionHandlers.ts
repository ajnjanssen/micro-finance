import { Transaction } from "@/types/finance";
import { createTransaction } from "../api/createTransaction";
import { updateTransaction } from "../api/updateTransaction";
import { deleteTransaction } from "../api/deleteTransaction";

export function useTransactionHandlers(
  onUpdate: () => void,
  setIsCreating: (v: boolean) => void,
  setEditingTransaction: (v: Transaction | null) => void
) {
  const handleCreate = async (transaction: Omit<Transaction, "id">) => {
    await createTransaction(transaction, () => {
      onUpdate();
      setIsCreating(false);
    });
  };

  const handleUpdate = async (transaction: Transaction) => {
    await updateTransaction(transaction, () => {
      onUpdate();
      setEditingTransaction(null);
    });
  };

  const handleDelete = async (transactionId: string) => {
    await deleteTransaction(transactionId, onUpdate);
  };

  return { handleCreate, handleUpdate, handleDelete };
}
