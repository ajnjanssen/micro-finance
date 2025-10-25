export interface BudgetItem {
	category: string;
	budgeted: number;
	spent: number;
	recommended: number;
	description: string;
	type?: string;
	isRecurring?: boolean;
}

export interface BudgetData {
	budgets: BudgetItem[];
	unmappedCategories: string[];
	categoryMap: { [key: string]: string };
}
