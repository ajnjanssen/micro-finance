import { useState, useEffect } from "react";
import type { BudgetItem } from "../types";

export function useBudgetData(savingsGoal: number, selectedMonth: string) {
	const [budgets, setBudgets] = useState<BudgetItem[]>([]);
	const [unmappedCategories, setUnmappedCategories] = useState<string[]>([]);
	const [categoryMap, setCategoryMap] = useState<{ [key: string]: string }>({});
	const [loading, setLoading] = useState(true);

	const loadBudgetData = async () => {
		try {
			const response = await fetch(
				`/api/finance/budget?savingsGoal=${savingsGoal}&month=${selectedMonth}`,
			);
			const data = await response.json();
			setBudgets(data.budgets);
			setUnmappedCategories(data.unmappedCategories || []);
			setCategoryMap(data.categoryMap || {});
		} catch (error) {
			console.error("Error loading budget:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadBudgetData();
	}, [savingsGoal, selectedMonth]);

	return {
		budgets,
		unmappedCategories,
		categoryMap,
		loading,
		reload: loadBudgetData,
	};
}
