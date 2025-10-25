import { formatCurrency } from "@/utils/formatters";
import type { BudgetItem } from "./types";

interface SummaryStatsProps {
	budgets: BudgetItem[];
}

export function SummaryStats({ budgets }: SummaryStatsProps) {
	const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
	const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
	const totalRecommended = budgets.reduce((sum, b) => sum + b.recommended, 0);

	return (
		<div className="stats shadow w-full">
			<div className="stat">
				<div className="stat-title">Totaal Gebudgetteerd</div>
				<div className="stat-value text-primary">
					{formatCurrency(totalBudgeted)}
				</div>
			</div>
			<div className="stat">
				<div className="stat-title">Totaal Uitgegeven</div>
				<div className="stat-value text-error">
					{formatCurrency(totalSpent)}
				</div>
			</div>
			<div className="stat">
				<div className="stat-title">Aanbevolen Budget</div>
				<div className="stat-value text-success">
					{formatCurrency(totalRecommended)}
				</div>
			</div>
			<div className="stat">
				<div className="stat-title">Verschil</div>
				<div
					className={`stat-value ${totalBudgeted - totalSpent >= 0 ? "text-success" : "text-error"}`}
				>
					{formatCurrency(totalBudgeted - totalSpent)}
				</div>
			</div>
		</div>
	);
}
