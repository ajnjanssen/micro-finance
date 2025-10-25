import type { RecurringExpense } from "@/types/financial-config";
import { ExpenseForm } from "./ExpenseForm";

interface ExpenseSectionProps {
	recurringExpenses: RecurringExpense[];
	showForm: boolean;
	editingExpense: RecurringExpense | null;
	onAdd: () => void;
	onEdit: (expense: RecurringExpense) => void;
	onSave: (data: Omit<RecurringExpense, "id">) => Promise<void>;
	onCancel: () => void;
	onDelete: (id: string) => Promise<void>;
}

export function ExpenseSection({
	recurringExpenses,
	showForm,
	editingExpense,
	onAdd,
	onEdit,
	onSave,
	onCancel,
	onDelete,
}: ExpenseSectionProps) {
	return (
		<div className="card bg-base-100 shadow-xl">
			<div className="card-body">
				<div className="flex justify-between items-center mb-4">
					<h2 className="card-title">💸 Terugkerende Uitgaven</h2>
					<button className="btn btn-primary btn-sm" onClick={onAdd}>
						+ Toevoegen
					</button>
				</div>

				{showForm && (
					<ExpenseForm
						expense={editingExpense}
						onSave={onSave}
						onCancel={onCancel}
					/>
				)}

				<div className="space-y-2">
					{recurringExpenses.length === 0 ? (
						<p className="text-center py-8 text-base-content/50">
							Nog geen terugkerende uitgaven geconfigureerd. Klik op "Toevoegen"
							om te beginnen.
						</p>
					) : (
						recurringExpenses.map((expense) => (
							<div
								key={expense.id}
								className={`flex items-center justify-between p-4 rounded-lg ${
									expense.isActive ? "bg-base-200" : "bg-base-200/50 opacity-60"
								}`}
							>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h3 className="font-semibold">{expense.name}</h3>
										{expense.isEssential && (
											<span className="badge badge-sm badge-error">
												Essentieel
											</span>
										)}
										{expense.isVariable && (
											<span className="badge badge-sm badge-warning">
												Variabel
											</span>
										)}
										{!expense.isActive && (
											<span className="badge badge-sm">Inactief</span>
										)}
									</div>
									<p className="text-sm text-base-content/70">
										€{expense.amount.toFixed(2)}/
										{expense.frequency === "monthly"
											? "maand"
											: expense.frequency}
										{expense.category && ` • ${expense.category}`}
									</p>
								</div>
								<div className="flex gap-2">
									<button
										className="btn btn-sm btn-ghost"
										onClick={() => onEdit(expense)}
									>
										Bewerken
									</button>
									<button
										className="btn btn-sm btn-ghost btn-error"
										onClick={() => onDelete(expense.id)}
									>
										Verwijderen
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
