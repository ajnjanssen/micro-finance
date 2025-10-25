interface SummaryCardsProps {
	totalMonthlyIncome: number;
	totalMonthlyExpenses: number;
	netMonthly: number;
	isPositive: boolean;
	activeIncomeCount: number;
	activeExpenseCount: number;
}

export function SummaryCards({
	totalMonthlyIncome,
	totalMonthlyExpenses,
	netMonthly,
	isPositive,
	activeIncomeCount,
	activeExpenseCount,
}: SummaryCardsProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div className="card bg-success text-success-content">
				<div className="card-body">
					<h2 className="card-title text-sm">Maandelijks Inkomen</h2>
					<p className="text-3xl font-bold">
						€{totalMonthlyIncome.toFixed(2)}
					</p>
					<p className="text-xs opacity-80">
						{activeIncomeCount} bronnen
					</p>
				</div>
			</div>

			<div className="card bg-error text-error-content">
				<div className="card-body">
					<h2 className="card-title text-sm">Maandelijkse Uitgaven</h2>
					<p className="text-3xl font-bold">
						€{totalMonthlyExpenses.toFixed(2)}
					</p>
					<p className="text-xs opacity-80">
						{activeExpenseCount} uitgaven
					</p>
				</div>
			</div>

			<div
				className={`card ${
					isPositive ? "bg-info" : "bg-warning"
				} text-base-content`}
			>
				<div className="card-body">
					<h2 className="card-title text-sm">Netto per Maand</h2>
					<p className="text-3xl font-bold">€{netMonthly.toFixed(2)}</p>
					<p className="text-xs opacity-80">
						{isPositive ? "✅ Positief" : "⚠️ Negatief"}
					</p>
				</div>
			</div>
		</div>
	);
}
