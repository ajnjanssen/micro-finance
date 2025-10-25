import { formatCurrency } from "@/utils/formatters";
import type { MonthlyOverview } from "@/types/finance";

interface KeyInsightsProps {
	projections: Array<{ date: string; totalBalance: number }>;
	monthlyOverview: MonthlyOverview | null;
	projectionMonths: number;
	currentBalance: number;
}

export function KeyInsights({
	projections,
	monthlyOverview,
	projectionMonths,
	currentBalance,
}: KeyInsightsProps) {
	const getBalanceColor = (balance: number) => {
		if (balance > currentBalance * 1.1) return "text-success";
		if (balance < currentBalance * 0.9) return "text-error";
		return "text-base-content";
	};

	return (
		<div className="card bg-base-200 shadow border-l-4 border-primary">
			<div className="card-body">
				<h2 className="text-xl font-semibold mb-4">Belangrijke Inzichten</h2>

				<div className="space-y-3">
					{projections.length > 0 && (
						<>
							<div className="flex items-center space-x-2">
								<span className="w-2 h-2 bg-primary rounded-full" />
								<span className="text-base-content">
									In {projectionMonths} maanden verwacht saldo:{" "}
									<span
										className={`font-semibold ${getBalanceColor(
											projections[projections.length - 1]?.totalBalance || 0
										)}`}
									>
										{formatCurrency(
											projections[projections.length - 1]?.totalBalance || 0
										)}
									</span>
								</span>
							</div>

							{monthlyOverview && (
								<div className="flex items-center space-x-2">
									<span className="w-2 h-2 bg-success rounded-full" />
									<span className="text-base-content">
										Gemiddeld maandelijks resultaat:{" "}
										<span
											className={`font-semibold ${
												monthlyOverview.netAmount >= 0
													? "text-success"
													: "text-error"
											}`}
										>
											{formatCurrency(monthlyOverview.netAmount)}
										</span>
									</span>
								</div>
							)}

							<div className="flex items-center space-x-2">
								<span className="w-2 h-2 bg-warning rounded-full" />
								<span className="text-base-content">
									Projecties zijn gebaseerd op terugkerende transacties en
									huidige balansen
								</span>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
