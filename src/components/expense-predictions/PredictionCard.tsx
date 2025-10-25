import { formatCurrency } from "@/utils/formatters";
import type { ExpensePattern } from "./hooks/useExpensePredictions";
import { getFrequencyLabel, getConfidenceColor } from "./utils";

interface PredictionCardProps {
	pattern: ExpensePattern;
}

export function PredictionCard({ pattern }: PredictionCardProps) {
	return (
		<div className="card bg-base-100 shadow">
			<div className="card-body p-4">
				<div className="flex justify-between items-start">
					<div>
						<h4 className="font-semibold">{pattern.category}</h4>
						<p className="text-xs text-base-content/70">
							{getFrequencyLabel(pattern.frequency)}
						</p>
					</div>
					<span
						className={`badge ${getConfidenceColor(pattern.confidence)}`}
					>
						{Math.round(pattern.confidence * 100)}%
					</span>
				</div>

				<div className="mt-2 space-y-1">
					<div className="flex justify-between text-sm">
						<span>Gemiddeld:</span>
						<span className="font-mono">
							{formatCurrency(pattern.averageAmount)}
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span>Voorspelling:</span>
						<span className="font-mono font-bold text-primary">
							{formatCurrency(pattern.predictedNextAmount)}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
