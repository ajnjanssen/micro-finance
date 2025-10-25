"use client";

import { useState } from "react";
import type { Account } from "@/types/finance";
import type {
	IncomeSource,
	RecurringExpense,
} from "@/types/financial-config";
import type { OnboardingStep } from "./types";
import { ProgressBar } from "./ProgressBar";
import { WelcomeStep } from "./WelcomeStep";
import { AccountsStep } from "./AccountsStep";
import { IncomeStep } from "./IncomeStep";
import { ExpensesStep } from "./ExpensesStep";
import { CompleteStep } from "./CompleteStep";
import { saveOnboardingData } from "./api";

interface OnboardingProps {
	onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
	const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
	const [accounts, setAccounts] = useState<Omit<Account, "id">[]>([]);
	const [incomeSources, setIncomeSources] = useState<
		Omit<IncomeSource, "id">[]
	>([]);
	const [expenses, setExpenses] = useState<Omit<RecurringExpense, "id">[]>([]);

	const handleFinish = async () => {
		try {
			await saveOnboardingData({ accounts, incomeSources, expenses });
			onComplete();
		} catch (error) {
			console.error("Error saving onboarding data:", error);
		}
	};

	return (
		<div className="fixed inset-0 bg-base-300 z-50 overflow-auto">
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="card bg-base-100 shadow-2xl w-full max-w-4xl">
					<ProgressBar currentStep={currentStep} />

					<div className="p-8">
						{currentStep === "welcome" && (
							<WelcomeStep onNext={() => setCurrentStep("accounts")} />
						)}

						{currentStep === "accounts" && (
							<AccountsStep
								accounts={accounts}
								onAdd={(account) => setAccounts([...accounts, account])}
								onRemove={(i) => setAccounts(accounts.filter((_, idx) => idx !== i))}
								onNext={() => setCurrentStep("income")}
								onBack={() => setCurrentStep("welcome")}
							/>
						)}

						{currentStep === "income" && (
							<IncomeStep
								incomeSources={incomeSources}
								onAdd={(income) => setIncomeSources([...incomeSources, income])}
								onRemove={(i) =>
									setIncomeSources(incomeSources.filter((_, idx) => idx !== i))
								}
								onNext={() => setCurrentStep("expenses")}
								onBack={() => setCurrentStep("accounts")}
							/>
						)}

						{currentStep === "expenses" && (
							<ExpensesStep
								expenses={expenses}
								onAdd={(expense) => setExpenses([...expenses, expense])}
								onRemove={(i) => setExpenses(expenses.filter((_, idx) => idx !== i))}
								onNext={() => setCurrentStep("complete")}
								onBack={() => setCurrentStep("income")}
							/>
						)}

						{currentStep === "complete" && (
							<CompleteStep
								accountsCount={accounts.length}
								incomeCount={incomeSources.length}
								expensesCount={expenses.length}
								onFinish={handleFinish}
								onBack={() => setCurrentStep("expenses")}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
