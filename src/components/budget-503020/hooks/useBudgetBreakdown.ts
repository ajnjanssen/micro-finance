import { useState, useEffect } from "react";
import type { BudgetBreakdown } from "../types";

export function useBudgetBreakdown() {
	const [breakdown, setBreakdown] = useState<BudgetBreakdown | null>(null);
	const [loading, setLoading] = useState(true);

	const loadBudgetBreakdown = async () => {
		try {
			const response = await fetch("/api/finance/budget/breakdown");
			const data = await response.json();
			setBreakdown(data);
		} catch (error) {
			console.error("Error loading budget breakdown:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadBudgetBreakdown();
	}, []);

	return { breakdown, loading, reload: loadBudgetBreakdown };
}
