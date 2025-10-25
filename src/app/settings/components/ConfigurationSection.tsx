"use client";

import { useState } from "react";
import type { IncomeSource, RecurringExpense } from "@/types/financial-config";
import { useConfigData } from "../configure/hooks/useConfigData";
import { calculateTotals } from "../configure/utils";
import { SummaryCards } from "../configure/SummaryCards";
import { IncomeSection } from "../configure/IncomeSection";
import { ExpenseSection } from "../configure/ExpenseSection";
import BudgetSettingsSection from "./BudgetSettingsSection";

interface ConfigurationSectionProps {
	onUpdate?: () => void;
}

export default function ConfigurationSection({ onUpdate }: ConfigurationSectionProps) {
	const { incomeSources, recurringExpenses, reload } = useConfigData();
	const [showIncomeForm, setShowIncomeForm] = useState(false);
	const [showExpenseForm, setShowExpenseForm] = useState(false);
	const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
	const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

	const totals = calculateTotals(incomeSources, recurringExpenses);

	const handleSaveIncome = async (data: Omit<IncomeSource, "id">) => {
		if (editingIncome) {
			await fetch("/api/config/income", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: editingIncome.id, ...data }),
			});
		} else {
			await fetch("/api/config/income", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
		}
		await reload();
		setShowIncomeForm(false);
		setEditingIncome(null);
		onUpdate?.();
	};

	const handleDeleteIncome = async (id: string) => {
		if (!confirm("Weet je zeker dat je deze inkomstenbron wilt verwijderen?")) return;
		await fetch("/api/config/income", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});
		await reload();
		onUpdate?.();
	};

	const handleSaveExpense = async (data: Omit<RecurringExpense, "id">) => {
		if (editingExpense) {
			await fetch("/api/config/expenses", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: editingExpense.id, ...data }),
			});
		} else {
			await fetch("/api/config/expenses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
		}
		await reload();
		setShowExpenseForm(false);
		setEditingExpense(null);
		onUpdate?.();
	};

	const handleDeleteExpense = async (id: string) => {
		if (!confirm("Weet je zeker dat je deze vaste last wilt verwijderen?")) return;
		await fetch("/api/config/expenses", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});
		await reload();
		onUpdate?.();
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Budget Configuratie</h2>
					<p className="text-sm text-base-content/60 mt-1">
						Beheer je maandelijkse inkomsten, vaste lasten en budget percentages
					</p>
				</div>
			</div>

			{/* Budget Percentages */}
			<BudgetSettingsSection />

			<div className="divider">Inkomsten & Uitgaven</div>

			<SummaryCards
				totalMonthlyIncome={totals.totalMonthlyIncome}
				totalMonthlyExpenses={totals.totalMonthlyExpenses}
				netMonthly={totals.netMonthly}
				isPositive={totals.isPositive}
				activeIncomeCount={incomeSources.filter((s) => s.isActive).length}
				activeExpenseCount={recurringExpenses.filter((e) => e.isActive).length}
			/>

			<IncomeSection
				incomeSources={incomeSources}
				showForm={showIncomeForm}
				editingIncome={editingIncome}
				onAdd={() => {
					setEditingIncome(null);
					setShowIncomeForm(true);
				}}
				onEdit={(income) => {
					setEditingIncome(income);
					setShowIncomeForm(true);
				}}
				onSave={handleSaveIncome}
				onCancel={() => {
					setShowIncomeForm(false);
					setEditingIncome(null);
				}}
				onDelete={handleDeleteIncome}
			/>

			<ExpenseSection
				recurringExpenses={recurringExpenses}
				showForm={showExpenseForm}
				editingExpense={editingExpense}
				onAdd={() => {
					setEditingExpense(null);
					setShowExpenseForm(true);
				}}
				onEdit={(expense) => {
					setEditingExpense(expense);
					setShowExpenseForm(true);
				}}
				onSave={handleSaveExpense}
				onCancel={() => {
					setShowExpenseForm(false);
					setEditingExpense(null);
				}}
				onDelete={handleDeleteExpense}
			/>
		</div>
	);
}
