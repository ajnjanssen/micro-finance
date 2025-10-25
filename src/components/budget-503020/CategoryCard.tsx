import { formatCurrency } from "@/utils/formatters";
import type { CategoryData } from "./types";
import { getPercentage, getStatusColor } from "./utils";

interface CategoryCardProps {
	title: string;
	subtitle: string;
	badge: string;
	badgeColor: "error" | "warning" | "success";
	borderColor: string;
	data: CategoryData;
}

export function CategoryCard({
	title,
	subtitle,
	badge,
	badgeColor,
	borderColor,
	data,
}: CategoryCardProps) {
	const percentage = getPercentage(data.spent, data.budgeted);
	const statusColor = getStatusColor(data.spent, data.budgeted);
	const remaining = data.budgeted - data.spent;

	return (
		<div className={`card bg-base-100 shadow-xl ${borderColor}`}>
			<div className="card-body">
				<div className="flex justify-between items-start mb-2">
					<div>
						<h3 className="text-lg font-bold">{title}</h3>
						<p className="text-xs text-base-content/70">{subtitle}</p>
					</div>
					<div className={`badge badge-lg badge-${badgeColor}`}>{badge}</div>
				</div>

				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Budget:</span>
						<span className="font-semibold">
							{formatCurrency(data.budgeted)}
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span>Uitgegeven:</span>
						<span className="font-semibold">{formatCurrency(data.spent)}</span>
					</div>
					<div className="flex justify-between text-sm font-bold">
						<span>Over:</span>
						<span
							className={remaining >= 0 ? "text-success" : "text-error"}
						>
							{formatCurrency(remaining)}
						</span>
					</div>
				</div>

				<div className="mt-4">
					<div className="flex justify-between text-xs mb-1">
						<span>{percentage}% gebruikt</span>
					</div>
					<progress
						className={`progress progress-${statusColor} w-full`}
						value={data.spent}
						max={data.budgeted}
					/>
				</div>

				<details className="mt-4" open>
					<summary className="cursor-pointer text-sm font-semibold">
						{data.items.length} uitgaven
					</summary>
					<ul className="mt-2 space-y-1 text-sm max-h-64 overflow-y-auto">
						{data.items.map((item, idx) => (
							<li key={idx} className="flex justify-between">
								<span>{item.name}</span>
								<span className="font-mono">{formatCurrency(item.amount)}</span>
							</li>
						))}
					</ul>
				</details>
			</div>
		</div>
	);
}
