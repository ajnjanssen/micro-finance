"use client";

import { useToast } from "@/components/ui/Toast";
import { Transaction } from "@/types/finance";

export function useTransactionActions(reload: () => Promise<void>) {
  const { showToast } = useToast();

  const handleAdd = async (transaction: any) => {
    try {
      const response = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "add-transaction", transaction }),
      });

      if (response.ok) {
        await reload();
        showToast("Transactie succesvol toegevoegd", "success");
        return true;
      } else {
        const errorData = await response.json();
        showToast(`Fout: ${errorData.error || 'Onbekende fout'}`, "error");
      }
    } catch (error) {
      showToast(`Fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`, "error");
    }
    return false;
  };

  const handleDelete = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/settings/transactions/${transactionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await reload();
        showToast("Transactie verwijderd", "success");
        return true;
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showToast("Fout bij verwijderen", "error");
    }
    return false;
  };

  const handleUpdate = async (transactionId: string, transaction: any) => {
    try {
      const response = await fetch("/api/finance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "update-transaction", 
          id: transactionId,
          updates: transaction 
        }),
      });

      if (response.ok) {
        await reload();
        showToast("Transactie succesvol bijgewerkt", "success");
        return true;
      } else {
        const errorData = await response.json();
        showToast(`Fout: ${errorData.error || 'Onbekende fout'}`, "error");
      }
    } catch (error) {
      showToast(`Fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`, "error");
    }
    return false;
  };

  const handleComplete = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/settings/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          completedDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (response.ok) {
        await reload();
        showToast("Transactie gemarkeerd als voltooid", "success");
        return true;
      }
    } catch (error) {
      console.error("Error completing transaction:", error);
      showToast("Fout bij markeren als voltooid", "error");
    }
    return false;
  };

  return { handleAdd, handleUpdate, handleDelete, handleComplete };
}
