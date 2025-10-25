export function getPercentage(spent: number, budgeted: number): number {
	if (budgeted === 0) return 0;
	return Math.round((spent / budgeted) * 100);
}

export function getStatusColor(
	spent: number,
	budgeted: number,
): "success" | "warning" | "error" {
	const percentage = (spent / budgeted) * 100;
	if (percentage <= 90) return "success";
	if (percentage <= 100) return "warning";
	return "error";
}
