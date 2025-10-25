export function getMonthOptions() {
	const options = [];
	const today = new Date();
	// Last 6 months + current + next 3 months
	for (let i = -6; i <= 3; i++) {
		const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
		const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		const label = date.toLocaleDateString("nl-NL", {
			year: "numeric",
			month: "long",
		});
		options.push({ value, label });
	}
	return options;
}

export function getProgressColor(
	spent: number,
	budgeted: number,
): string {
	const percentage = (spent / budgeted) * 100;
	if (percentage <= 80) return "bg-success";
	if (percentage <= 100) return "bg-warning";
	return "bg-error";
}

export function getCurrentMonth(): string {
	const today = new Date();
	return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}
