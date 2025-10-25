import { useState, useEffect } from "react";

export interface ExpensePattern {
	category: string;
	averageAmount: number;
	frequency: "daily" | "weekly" | "monthly" | "irregular";
	confidence: number;
	lastOccurrence: string;
	predictedNextAmount: number;
}

export interface ExpensePrediction {
	month: string;
	predictedExpenses: ExpensePattern[];
	totalPredictedExpense: number;
	confidence: number;
}

export function useExpensePredictions() {
	const [predictions, setPredictions] = useState<ExpensePrediction[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedMonth, setSelectedMonth] = useState(0);

	const loadPredictions = async () => {
		try {
			const response = await fetch("/api/finance/predictions?months=12");
			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}
			const data = await response.json();
			setPredictions(data);
		} catch (error) {
			console.error("Error loading predictions:", error);
			setPredictions([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadPredictions();
	}, []);

	return {
		predictions,
		loading,
		selectedMonth,
		setSelectedMonth,
	};
}
