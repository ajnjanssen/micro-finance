import { useState } from "react";
import type { Transaction, Account } from "@/types/finance";

export function useTransactionFormState(
	accounts: Account[],
	editTransaction?: Transaction,
) {
	const [formData, setFormData] = useState({
		description: editTransaction?.description || "",
		amount: editTransaction ? Math.abs(editTransaction.amount).toString() : "",
		type: editTransaction?.type || ("expense" as "income" | "expense" | "transfer"),
		category: editTransaction?.category || "",
		accountId: editTransaction?.accountId || accounts[0]?.id || "",
		toAccountId: editTransaction?.toAccountId || "",
		date: editTransaction?.date || new Date().toISOString().split("T")[0],
		isRecurring: editTransaction?.isRecurring || false,
		recurringType:
			editTransaction?.recurringType ||
			("monthly" as "monthly" | "yearly" | "weekly" | "daily"),
		recurringEndDate: editTransaction?.recurringEndDate || "",
		tags: editTransaction?.tags ? editTransaction.tags.join(", ") : "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	return { formData, setFormData, isSubmitting, setIsSubmitting };
}
