"use client";

import { useState } from "react";
import SettingsLayout from "@/components/SettingsLayout";
import type {
	IncomeSource,
	RecurringExpense,
} from "@/types/financial-config";
import { useConfigData } from "./hooks/useConfigData";
import { calculateTotals } from "./utils";
import { SummaryCards } from "./SummaryCards";
import { IncomeSection } from "./IncomeSection";
import { ExpenseSection } from "./ExpenseSection";

export default function ConfigurePage() {
	const { incomeSources, recurringExpenses, reload } = useConfigData();

	const [showIncomeForm, setShowIncomeForm] = useState(false);
	const [showExpenseForm, setShowExpenseForm] = useState(false);
	const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(
		null
	);
	const [editingExpense, setEditingExpense] =
		useState<RecurringExpense | null>(null);

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
		setShowIncomeForm(false);
		setEditingIncome(null);
		reload();
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
		setShowExpenseForm(false);
		setEditingExpense(null);
		reload();
	};

	const handleDeleteIncome = async (id: string) => {
		const source = incomeSources.find((s) => s.id === id);
		if (confirm(`Weet je zeker dat je "${source?.name}" wilt verwijderen?`)) {
			await fetch(`/api/config/income?id=${id}`, { method: "DELETE" });
			reload();
		}
	};

	const handleDeleteExpense = async (id: string) => {
		const expense = recurringExpenses.find((e) => e.id === id);
		if (confirm(`Weet je zeker dat je "${expense?.name}" wilt verwijderen?`)) {
			await fetch(`/api/config/expenses?id=${id}`, { method: "DELETE" });
			reload();
		}
	};

	return (
		<SettingsLayout>
			<div className="space-y-6">
				<SummaryCards
					{...totals}
					activeIncomeCount={incomeSources.filter((s) => s.isActive).length}
					activeExpenseCount={
						recurringExpenses.filter((e) => e.isActive).length
					}
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
		</SettingsLayout>
	);
}
