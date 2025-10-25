import { formatCurrency } from "@/utils/formatters";
import type { BudgetBreakdown } from "./types";

interface SummaryCardProps {
	breakdown: BudgetBreakdown;
}

export function SummaryCard({ breakdown }: SummaryCardProps) {
	const totalBudgeted =
		breakdown.needs.budgeted +
		breakdown.wants.budgeted +
		breakdown.savings.budgeted;
	const totalSpent =
		breakdown.needs.spent + breakdown.wants.spent + breakdown.savings.spent;

	return (
		<div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
			<div className="card-body">
				<h2 className="text-2xl font-bold mb-4">50/30/20 Budget Overzicht</h2>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm text-base-content/70">Totaal Inkomen</p>
						<p className="text-2xl font-bold text-success">
							{formatCurrency(breakdown.totalIncome)}
						</p>
					</div>
					<div>
						<p className="text-sm text-base-content/70">Totaal Gebudgetteerd</p>
						<p className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</p>
					</div>
					<div>
						<p className="text-sm text-base-content/70">Totaal Uitgegeven</p>
						<p className="text-2xl font-bold text-error">
							{formatCurrency(totalSpent)}
						</p>
					</div>
					<div>
						<p className="text-sm text-base-content/70">Verschil</p>
						<p
							className={`text-2xl font-bold ${totalBudgeted - totalSpent >= 0 ? "text-success" : "text-error"}`}
						>
							{formatCurrency(totalBudgeted - totalSpent)}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
