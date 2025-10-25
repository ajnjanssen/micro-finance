import { useState } from "react";
import type { SavingsGoal } from "@/types/savings-goals";

interface GoalFormProps {
	editingGoal: SavingsGoal | null;
	defaultMonthlySavings: number;
	onSubmit: (goal: any) => Promise<void>;
	onCancel: () => void;
}

export function GoalForm({
	editingGoal,
	defaultMonthlySavings,
	onSubmit,
	onCancel,
}: GoalFormProps) {
	const [formData, setFormData] = useState({
		name: editingGoal?.name || "",
		targetAmount: editingGoal?.targetAmount || 0,
		currentAmount: editingGoal?.currentAmount || 0,
		monthlyContribution:
			editingGoal?.monthlyContribution || defaultMonthlySavings,
		priority: editingGoal?.priority || ("medium" as const),
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSubmit(formData);
	};

	return (
		<div className="card bg-base-200 p-6">
			<h3 className="text-lg font-bold mb-4">
				{editingGoal ? "Doel Bewerken" : "Nieuw Spaardoel"}
			</h3>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="label-text">Naam</label>
					<input
						type="text"
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						className="input input-bordered w-full"
						required
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="label-text">Streefbedrag (€)</label>
						<input
							type="number"
							step="0.01"
							value={formData.targetAmount}
							onChange={(e) =>
								setFormData({
									...formData,
									targetAmount: parseFloat(e.target.value),
								})
							}
							className="input input-bordered w-full"
							required
						/>
					</div>

					<div>
						<label className="label-text">Huidig Gespaard (€)</label>
						<input
							type="number"
							step="0.01"
							value={formData.currentAmount}
							onChange={(e) =>
								setFormData({
									...formData,
									currentAmount: parseFloat(e.target.value),
								})
							}
							className="input input-bordered w-full"
							required
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="label-text">Maandelijks Sparen (€)</label>
						<input
							type="number"
							step="0.01"
							value={formData.monthlyContribution}
							onChange={(e) =>
								setFormData({
									...formData,
									monthlyContribution: parseFloat(e.target.value),
								})
							}
							className="input input-bordered w-full"
							required
						/>
					</div>

					<div>
						<label className="label-text">Prioriteit</label>
						<select
							value={formData.priority}
							onChange={(e) =>
								setFormData({
									...formData,
									priority: e.target.value as any,
								})
							}
							className="select select-bordered w-full"
						>
							<option value="low">Laag</option>
							<option value="medium">Gemiddeld</option>
							<option value="high">Hoog</option>
						</select>
					</div>
				</div>

				<div className="flex gap-2 pt-4">
					<button type="button" onClick={onCancel} className="btn flex-1">
						Annuleren
					</button>
					<button type="submit" className="btn btn-primary flex-1">
						{editingGoal ? "Bijwerken" : "Toevoegen"}
					</button>
				</div>
			</form>
		</div>
	);
}
