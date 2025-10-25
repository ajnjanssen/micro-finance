import { useState, useEffect } from "react";

export function useSavingsRate() {
	const [monthlySavingsRate, setMonthlySavingsRate] = useState(0);
	const [savingsAccountBalance, setSavingsAccountBalance] = useState(0);

	const calculateSavingsRate = async () => {
		try {
			// Get monthly overview
			const response = await fetch("/api/finance/overview");
			const data = await response.json();

			if (data.monthlyOverview) {
				const projectedIncome = data.monthlyOverview.projectedIncome || 0;
				const projectedExpenses = data.monthlyOverview.projectedExpenses || 0;
				const savingsRate = Math.max(0, projectedIncome - projectedExpenses);
				setMonthlySavingsRate(savingsRate);
			}

			// Get savings account balance
			const financeResponse = await fetch("/api/finance");
			const financeData = await financeResponse.json();

			const today = new Date();
			today.setHours(23, 59, 59, 999);

			let savingsBalance = 0;
			financeData.transactions.forEach((tx: any) => {
				if (tx.accountId === "savings-1") {
					const txDate = new Date(tx.date);
					if (txDate <= today) {
						savingsBalance += tx.amount;
					}
				}
			});

			setSavingsAccountBalance(savingsBalance);
		} catch (error) {
			console.error("Error calculating savings rate:", error);
		}
	};

	useEffect(() => {
		calculateSavingsRate();
	}, []);

	return {
		monthlySavingsRate,
		savingsAccountBalance,
		reload: calculateSavingsRate,
	};
}
