import { formatCurrency, formatDate } from "@/utils/formatters";

interface MonthlyBreakdownProps {
	projections: Array<{ date: string; totalBalance: number }>;
	currentBalance: number;
}

export function MonthlyBreakdown({
	projections,
	currentBalance,
}: MonthlyBreakdownProps) {
	const getBalanceColor = (balance: number) => {
		if (balance > currentBalance * 1.1) return "text-success";
		if (balance < currentBalance * 0.9) return "text-error";
		return "text-base-content";
	};

	if (projections.length === 0) return null;

	return (
		<div className="card bg-base-100 shadow">
			<div className="card-body">
				<h3 className="text-lg font-semibold text-base-content mb-3">
					Toekomstige Maanden
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{projections.slice(1, 7).map((projection, index) => {
						const previousBalance = projections[index].totalBalance;
						const monthlyChange = projection.totalBalance - previousBalance;

						return (
							<div
								key={index}
								className="border border-success/10 rounded-lg p-4 bg-base-200"
							>
								<h4 className="text-sm font-medium text-base-content mb-1">
									{formatDate(projection.date)}
								</h4>
								<p
									className={`text-xl font-bold ${getBalanceColor(
										projection.totalBalance
									)}`}
								>
									{formatCurrency(projection.totalBalance)}
								</p>
								<div className="mt-2 text-xs text-base-content">
									{monthlyChange >= 0 ? (
										<span className="text-success">
											+{formatCurrency(monthlyChange)} groei
										</span>
									) : (
										<span className="text-error">
											{formatCurrency(monthlyChange)} verlies
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
