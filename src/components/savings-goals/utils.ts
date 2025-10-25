import type { SavingsGoal } from "@/types/savings-goals";

export function getMonthsToTarget(goal: SavingsGoal): number {
	const remaining = goal.targetAmount - goal.currentAmount;
	if (remaining <= 0) return 0;
	if (!goal.monthlyContribution || goal.monthlyContribution <= 0)
		return Infinity;
	return Math.ceil(remaining / goal.monthlyContribution);
}

export function getProgressPercentage(goal: SavingsGoal): number {
	if (goal.targetAmount === 0) return 0;
	return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

export function getPriorityColor(priority: SavingsGoal["priority"]): string {
	const colors = {
		low: "badge-info",
		medium: "badge-warning",
		high: "badge-error",
	};
	return colors[priority];
}

export function getPriorityLabel(priority: SavingsGoal["priority"]): string {
	const labels = {
		low: "Laag",
		medium: "Gemiddeld",
		high: "Hoog",
	};
	return labels[priority];
}
