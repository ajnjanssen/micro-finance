import { useState } from "react";
import { Transaction } from "@/types/finance";

interface FormData {
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  accountId: string;
  date: string;
  isRecurring: boolean;
  recurringType: "monthly" | "yearly" | "weekly" | "daily";
  tags: string;
}

interface UseTransactionFormReturn {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handleSubmit: (e: React.FormEvent, transaction?: Transaction | null) => void;
}

export function useTransactionForm(
  transaction: Transaction | null | undefined,
  onSave: (transaction: any) => void
): UseTransactionFormReturn {
  const [formData, setFormData] = useState<FormData>({
    description: transaction?.description || "",
    amount: transaction?.amount || 0,
    type: transaction?.type || "expense",
    category: transaction?.category || "",
    accountId: transaction?.accountId || "",
    date: transaction?.date || new Date().toISOString().split("T")[0],
    isRecurring: transaction?.isRecurring || false,
    recurringType: transaction?.recurringType || "monthly",
    tags: transaction?.tags?.join(", ") || "",
  });

  const handleSubmit = (e: React.FormEvent, trans?: Transaction | null) => {
    e.preventDefault();
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount.toString()),
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [],
    };

    if (trans) {
      onSave({ ...trans, ...transactionData });
    } else {
      onSave({ ...transactionData, id: `tx-manual-${Date.now()}` });
    }
  };

  return { formData, setFormData, handleSubmit };
}
