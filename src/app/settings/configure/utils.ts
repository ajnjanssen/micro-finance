export function calculateTotals(
	incomeSources: Array<{ amount: number; isActive: boolean }>,
	recurringExpenses: Array<{ amount: number; isActive: boolean }>
) {
	const totalMonthlyIncome = incomeSources
		.filter((s) => s.isActive)
		.reduce((sum, s) => sum + s.amount, 0);

	const totalMonthlyExpenses = recurringExpenses
		.filter((e) => e.isActive)
		.reduce((sum, e) => sum + e.amount, 0);

	const netMonthly = totalMonthlyIncome - totalMonthlyExpenses;

	return {
		totalMonthlyIncome,
		totalMonthlyExpenses,
		netMonthly,
		isPositive: netMonthly >= 0,
	};
}
