import { useState, useEffect } from "react";
import type { BalanceProjection, MonthlyOverview } from "@/types/finance";

interface UseDashboardDataResult {
	projections: BalanceProjection[];
	monthlyProjections: any[];
	monthlyOverview: MonthlyOverview | null;
	categoryDetails: { [category: string]: any };
	loading: boolean;
	reloadData: () => Promise<void>;
}

export function useDashboardData(
	projectionMonths: number,
): UseDashboardDataResult {
	const [projections, setProjections] = useState<BalanceProjection[]>([]);
	const [monthlyProjections, setMonthlyProjections] = useState<any[]>([]);
	const [monthlyOverview, setMonthlyOverview] =
		useState<MonthlyOverview | null>(null);
	const [categoryDetails, setCategoryDetails] = useState<{
		[category: string]: any;
	}>({});
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		try {
			setLoading(true);

			// Load projections
			const projResponse = await fetch(
				`/api/projections-v3?months=${projectionMonths}`,
			);
			const monthlyProj = await projResponse.json();

			const balanceProj: BalanceProjection[] = monthlyProj.map((p: any) => ({
				date: `${p.month}-01`,
				totalBalance: p.projectedBalance,
				accountBalances: p.accountBalances || {},
			}));

			setProjections(balanceProj);
			setMonthlyProjections(monthlyProj);

			// Load monthly overview
			const overviewResponse = await fetch("/api/overview-v3");
			const overviewData = await overviewResponse.json();

			const today = new Date();
			const monthStr = today.toLocaleDateString("nl-NL", {
				year: "numeric",
				month: "2-digit",
			});

			setMonthlyOverview({
				month: monthStr,
				totalIncome: overviewData.configuredIncome,
				totalExpenses: overviewData.configuredExpenses,
				netAmount: overviewData.configuredNet,
				topCategories: [],
				actualIncome: overviewData.actualIncome,
				actualExpenses: overviewData.actualExpenses,
			});

			setCategoryDetails(overviewData.categoryDetails || {});
		} catch (error) {
			console.error("Error loading dashboard data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, [projectionMonths]);

	return {
		projections,
		monthlyProjections,
		monthlyOverview,
		categoryDetails,
		loading,
		reloadData: loadData,
	};
}
