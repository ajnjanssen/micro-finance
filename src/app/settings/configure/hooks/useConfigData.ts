import { useState, useEffect } from "react";
import type { IncomeSource, RecurringExpense } from "@/types/financial-config";

export function useConfigData() {
	const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
	const [recurringExpenses, setRecurringExpenses] = useState<
		RecurringExpense[]
	>([]);

	const loadData = async () => {
		try {
			const [incomeRes, expensesRes] = await Promise.all([
				fetch("/api/config/income"),
				fetch("/api/config/expenses"),
			]);

			const income = await incomeRes.json();
			const expenses = await expensesRes.json();

			setIncomeSources(income);
			setRecurringExpenses(expenses);
		} catch (error) {
			console.error("Failed to load configuration:", error);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	return { incomeSources, recurringExpenses, reload: loadData };
}
