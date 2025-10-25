import { formatCurrency, formatDate } from "@/utils/formatters";

interface ProjectionTableProps {
	projections: Array<{ date: string; totalBalance: number }>;
	currentBalance: number;
}

export function ProjectionTable({
	projections,
	currentBalance,
}: ProjectionTableProps) {
	const getBalanceColor = (balance: number) => {
		if (balance > currentBalance * 1.1) return "text-success";
		if (balance < currentBalance * 0.9) return "text-error";
		return "text-base-content";
	};

	if (projections.length <= 6) return null;

	return (
		<div className="card bg-base-100 shadow">
			<div className="card-body">
				<h3 className="text-lg font-semibold mb-3">Jaarlijks Overzicht</h3>
				<div className="overflow-x-auto">
					<table className="table table-zebra">
						<thead>
							<tr>
								<th>Datum</th>
								<th>Totaal Saldo</th>
								<th>Verschil</th>
							</tr>
						</thead>
						<tbody>
							{projections
								.filter((_, index) => index % 12 === 0)
								.map((projection, index) => (
									<tr key={index}>
										<td>{formatDate(projection.date)}</td>
										<td className="font-medium">
											<span className={getBalanceColor(projection.totalBalance)}>
												{formatCurrency(projection.totalBalance)}
											</span>
										</td>
										<td>
											{projection.totalBalance > currentBalance ? (
												<span className="text-success">
													+
													{formatCurrency(
														projection.totalBalance - currentBalance
													)}
												</span>
											) : (
												<span className="text-error">
													{formatCurrency(
														projection.totalBalance - currentBalance
													)}
												</span>
											)}
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
