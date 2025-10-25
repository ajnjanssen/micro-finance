"use client";

import { formatCurrency } from "@/utils/formatters";
import { useExpensePredictions } from "./hooks/useExpensePredictions";
import { PredictionCard } from "./PredictionCard";
import { formatMonth } from "./utils";

export default function ExpensePredictions() {
	const { predictions, loading, selectedMonth, setSelectedMonth } =
		useExpensePredictions();

	if (loading) {
		return (
			<div className="card p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-4 bg-base-300 rounded w-1/4" />
					<div className="h-8 bg-base-300 rounded w-1/2" />
				</div>
			</div>
		);
	}

	if (predictions.length === 0) {
		return (
			<div className="card p-6">
				<p className="text-base-content/70">
					Geen voorspellingen beschikbaar. Voeg eerst transacties toe.
				</p>
			</div>
		);
	}

	const currentPrediction = predictions[selectedMonth];

	return (
		<div className="space-y-6">
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h2 className="text-2xl font-bold mb-4">Uitgaven Voorspellingen</h2>

					<div className="flex gap-2 mb-4 overflow-x-auto">
						{predictions.map((pred, idx) => (
							<button
								key={pred.month}
								onClick={() => setSelectedMonth(idx)}
								className={`btn btn-sm ${idx === selectedMonth ? "btn-primary" : "btn-ghost"}`}
							>
								{formatMonth(pred.month)}
							</button>
						))}
					</div>

					{currentPrediction && (
						<div className="stats shadow">
							<div className="stat">
								<div className="stat-title">Totaal Verwacht</div>
								<div className="stat-value text-error">
									{formatCurrency(currentPrediction.totalPredictedExpense)}
								</div>
								<div className="stat-desc">
									Betrouwbaarheid:{" "}
									{Math.round(currentPrediction.confidence * 100)}%
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{currentPrediction && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{currentPrediction.predictedExpenses.map((pattern, idx) => (
						<PredictionCard key={idx} pattern={pattern} />
					))}
				</div>
			)}
		</div>
	);
}
