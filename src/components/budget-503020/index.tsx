"use client";

import { useBudgetBreakdown } from "./hooks/useBudgetBreakdown";
import { SummaryCard } from "./SummaryCard";
import { CategoryCard } from "./CategoryCard";

export default function Budget503020() {
	const { breakdown, loading } = useBudgetBreakdown();

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

	if (!breakdown) {
		return (
			<div className="card p-6">
				<p className="text-base-content/70">Geen budget data beschikbaar</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<SummaryCard breakdown={breakdown} />

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<CategoryCard
					title="50% Essentieel"
					subtitle="Vaste lasten"
					badge="NEEDS"
					badgeColor="error"
					borderColor="border-l-4 border-error"
					data={breakdown.needs}
				/>

				<CategoryCard
					title="30% Levensstijl"
					subtitle="Discretionaire uitgaven"
					badge="WANTS"
					badgeColor="warning"
					borderColor="border-l-4 border-warning"
					data={breakdown.wants}
				/>

				<CategoryCard
					title="20% Sparen"
					subtitle="Toekomst & schulden"
					badge="SAVINGS"
					badgeColor="success"
					borderColor="border-l-4 border-success"
					data={breakdown.savings}
				/>
			</div>
		</div>
	);
}
