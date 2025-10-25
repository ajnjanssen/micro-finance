import { useState } from "react";
import type { Transaction } from "@/types/finance";

export function useTransactionFilters(transactions: Transaction[]) {
	const [filter, setFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [sortBy, setSortBy] = useState("date-desc");

	const filteredTransactions = transactions.filter((transaction) => {
		if (filter !== "all" && transaction.type !== filter) {
			return false;
		}
		if (categoryFilter !== "all" && transaction.category !== categoryFilter) {
			return false;
		}
		return true;
	});

	const sortedTransactions = [...filteredTransactions].sort((a, b) => {
		switch (sortBy) {
			case "date-desc":
				return new Date(b.date).getTime() - new Date(a.date).getTime();
			case "date-asc":
				return new Date(a.date).getTime() - new Date(b.date).getTime();
			case "amount-desc":
				return Math.abs(b.amount) - Math.abs(a.amount);
			case "amount-asc":
				return Math.abs(a.amount) - Math.abs(b.amount);
			default:
				return 0;
		}
	});

	return {
		filter,
		setFilter,
		categoryFilter,
		setCategoryFilter,
		sortBy,
		setSortBy,
		sortedTransactions,
	};
}
