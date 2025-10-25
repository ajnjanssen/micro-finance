"use client";

import { useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import { useSavingsGoals } from "./hooks/useSavingsGoals";
import { useSavingsRate } from "./hooks/useSavingsRate";
import { GoalCard } from "./GoalCard";
import { GoalForm } from "./GoalForm";
import type { SavingsGoal } from "@/types/savings-goals";

export default function SavingsGoals() {
	const { goals, loading, addGoal, updateGoal, deleteGoal } =
		useSavingsGoals();
	const { monthlySavingsRate, savingsAccountBalance } = useSavingsRate();

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

	const handleSubmit = async (formData: any) => {
		if (editingGoal) {
			await updateGoal(editingGoal.id, formData);
			setEditingGoal(null);
		} else {
			await addGoal(formData);
			setShowAddForm(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (confirm("Weet je zeker dat je dit spaardoel wilt verwijderen?")) {
			await deleteGoal(id);
		}
	};

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

	return (
		<div className="space-y-6">
			<div className="card bg-gradient-to-br from-success/10 to-primary/10 border-2 border-success/20">
				<div className="card-body">
					<h2 className="text-2xl font-bold mb-4">Spaardoelen</h2>

					<div className="stats shadow">
						<div className="stat">
							<div className="stat-title">Maandelijks Sparen</div>
							<div className="stat-value text-success">
								{formatCurrency(monthlySavingsRate)}
							</div>
						</div>
						<div className="stat">
							<div className="stat-title">Huidig Spaarsaldo</div>
							<div className="stat-value text-primary">
								{formatCurrency(savingsAccountBalance)}
							</div>
						</div>
						<div className="stat">
							<div className="stat-title">Actieve Doelen</div>
							<div className="stat-value">{goals.length}</div>
						</div>
					</div>

					{!showAddForm && !editingGoal && (
						<button
							onClick={() => setShowAddForm(true)}
							className="btn btn-primary mt-4"
						>
							+ Nieuw Spaardoel
						</button>
					)}
				</div>
			</div>

			{(showAddForm || editingGoal) && (
				<GoalForm
					editingGoal={editingGoal}
					defaultMonthlySavings={monthlySavingsRate}
					onSubmit={handleSubmit}
					onCancel={() => {
						setShowAddForm(false);
						setEditingGoal(null);
					}}
				/>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{goals.map((goal) => (
					<GoalCard
						key={goal.id}
						goal={goal}
						onEdit={setEditingGoal}
						onDelete={handleDelete}
					/>
				))}
			</div>

			{goals.length === 0 && !showAddForm && (
				<div className="text-center text-base-content/70 py-8">
					Geen spaardoelen gevonden. Maak er een aan!
				</div>
			)}
		</div>
	);
}
