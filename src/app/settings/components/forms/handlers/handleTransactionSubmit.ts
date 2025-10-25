import { Transaction } from "@/types/finance";

interface FormData {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  accountId: string;
  date: string;
  isRecurring: boolean;
  recurringType: string;
  tags: string;
}

export function handleTransactionSubmit(
  e: React.FormEvent,
  formData: FormData,
  transaction: Transaction | null | undefined,
  onSave: (transaction: any) => void
) {
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

  if (transaction) {
    onSave({ ...transaction, ...transactionData });
  } else {
    onSave({ ...transactionData, id: `tx-manual-${Date.now()}` });
  }
}
