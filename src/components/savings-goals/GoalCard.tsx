import { formatCurrency } from "@/utils/formatters";
import type { SavingsGoal } from "@/types/savings-goals";
import {
	getMonthsToTarget,
	getProgressPercentage,
	getPriorityColor,
	getPriorityLabel,
} from "./utils";

interface GoalCardProps {
	goal: SavingsGoal;
	onEdit: (goal: SavingsGoal) => void;
	onDelete: (id: string) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
	const progress = getProgressPercentage(goal);
	const monthsLeft = getMonthsToTarget(goal);

	return (
		<div className="card bg-base-100 shadow">
			<div className="card-body">
				<div className="flex justify-between items-start">
					<h3 className="text-lg font-bold">{goal.name}</h3>
					<span className={`badge ${getPriorityColor(goal.priority)}`}>
						{getPriorityLabel(goal.priority)}
					</span>
				</div>

				<div className="space-y-2 mt-2">
					<div className="flex justify-between text-sm">
						<span>Doel:</span>
						<span className="font-mono font-bold">
							{formatCurrency(goal.targetAmount)}
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span>Gespaard:</span>
						<span className="font-mono">
							{formatCurrency(goal.currentAmount)}
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span>Per maand:</span>
						<span className="font-mono">
							{formatCurrency(goal.monthlyContribution || 0)}
						</span>
					</div>
				</div>

				<div className="mt-4">
					<div className="flex justify-between text-xs mb-1">
						<span>{progress.toFixed(1)}% bereikt</span>
						<span>
							{monthsLeft === Infinity
								? "∞"
								: `${monthsLeft} maand${monthsLeft !== 1 ? "en" : ""}`}
						</span>
					</div>
					<progress
						className="progress progress-primary w-full"
						value={progress}
						max={100}
					/>
				</div>

				<div className="flex gap-2 mt-4">
					<button
						onClick={() => onEdit(goal)}
						className="btn btn-ghost btn-sm flex-1"
					>
						✏️ Bewerken
					</button>
					<button
						onClick={() => onDelete(goal.id)}
						className="btn btn-ghost btn-sm text-error"
					>
						🗑️
					</button>
				</div>
			</div>
		</div>
	);
}
