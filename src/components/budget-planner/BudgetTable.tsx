import { formatCurrency } from "@/utils/formatters";
import type { BudgetItem } from "./types";
import { getProgressColor } from "./utils";

interface BudgetTableProps {
	budgets: BudgetItem[];
}

export function BudgetTable({ budgets }: BudgetTableProps) {
	return (
		<div className="overflow-x-auto">
			<table className="table table-zebra">
				<thead>
					<tr>
						<th>Categorie</th>
						<th>Gebudgetteerd</th>
						<th>Uitgegeven</th>
						<th>Aanbevolen</th>
						<th>Voortgang</th>
					</tr>
				</thead>
				<tbody>
					{budgets.map((budget, idx) => (
						<tr key={idx}>
							<td>
								<div>
									<div className="font-semibold">{budget.category}</div>
									<div className="text-xs text-base-content/70">
										{budget.description}
									</div>
								</div>
							</td>
							<td className="font-mono">{formatCurrency(budget.budgeted)}</td>
							<td className="font-mono">{formatCurrency(budget.spent)}</td>
							<td className="font-mono">
								{formatCurrency(budget.recommended)}
							</td>
							<td>
								<div className="flex items-center gap-2">
									<progress
										className={`progress ${getProgressColor(budget.spent, budget.budgeted)} w-20`}
										value={budget.spent}
										max={budget.budgeted}
									/>
									<span className="text-xs">
										{Math.round((budget.spent / budget.budgeted) * 100)}%
									</span>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
