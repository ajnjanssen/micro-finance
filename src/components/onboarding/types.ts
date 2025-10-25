import type { Account } from "@/types/finance";
import type {
	IncomeSource,
	RecurringExpense,
} from "@/types/financial-config";

export type OnboardingStep =
	| "welcome"
	| "accounts"
	| "income"
	| "expenses"
	| "complete";

export interface StepConfig {
	id: OnboardingStep;
	title: string;
	number: number;
}

export interface OnboardingData {
	accounts: Omit<Account, "id">[];
	incomeSources: Omit<IncomeSource, "id">[];
	expenses: Omit<RecurringExpense, "id">[];
}

export interface NavigationProps {
	onNext: () => void;
	onBack: () => void;
}
