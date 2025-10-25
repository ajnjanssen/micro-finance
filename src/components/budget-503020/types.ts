export interface BudgetBreakdown {
	needs: CategoryData;
	wants: CategoryData;
	savings: CategoryData;
	totalIncome: number;
}

export interface CategoryData {
	budgeted: number;
	spent: number;
	items: Array<{ name: string; amount: number; category: string }>;
}

export type CategoryType = "needs" | "wants" | "savings";
