import type { Transaction, Account, Category } from "@/types/finance";

export function useTransactionHelpers(
	accounts: Account[],
	categories: Category[],
) {
	const getAccountName = (accountId: string) => {
		const account = accounts.find((acc) => acc.id === accountId);
		return account ? account.name : "Onbekend";
	};

	const getCategoryName = (categoryId: string) => {
		const category = categories.find((cat) => cat.id === categoryId);
		return category ? category.name : "Onbekend";
	};

	const getCategoryColor = (categoryId: string) => {
		const category = categories.find((cat) => cat.id === categoryId);
		return category ? category.color : "#6B7280";
	};

	const getRecurringLabel = (transaction: Transaction) => {
		if (!transaction.isRecurring) return "";

		const labels = {
			monthly: "📅 Maandelijks",
			yearly: "📅 Jaarlijks",
			weekly: "📅 Wekelijks",
			daily: "📅 Dagelijks",
		};

		return labels[transaction.recurringType || "monthly"] || "📅 Terugkerend";
	};

	return {
		getAccountName,
		getCategoryName,
		getCategoryColor,
		getRecurringLabel,
	};
}
