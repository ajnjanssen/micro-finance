"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/utils/formatters";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { Transaction } from "@/types/finance";

interface TransactionRowProps {
	transaction: Transaction;
	getAccountName: (id: string) => string;
	getCategoryName: (id: string) => string;
	getCategoryColor: (id: string) => string;
	getRecurringLabel: (t: Transaction) => string;
	onEdit?: (transaction: Transaction) => void;
	onDelete?: (transactionId: string) => void;
	onComplete?: (transactionId: string) => void;
}

export function TransactionRow({
	transaction,
	getAccountName,
	getCategoryName,
	getCategoryColor,
	getRecurringLabel,
	onEdit,
	onDelete,
	onComplete,
}: TransactionRowProps) {
	const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const handleComplete = () => {
		if (onComplete) {
			onComplete(transaction.id);
		}
		setShowCompleteConfirm(false);
	};

	const handleDelete = () => {
		if (onDelete) {
			onDelete(transaction.id);
		}
		setShowDeleteConfirm(false);
	};

	return (
		<>
			<tr className={transaction.completed ? "opacity-50" : ""}>
				<td>{formatDate(transaction.date)}</td>
				<td>
					<div className="font-semibold">{transaction.description}</div>
					<div className="text-xs text-base-content/70">
						{getAccountName(transaction.accountId)}
					</div>
				</td>
				<td>
					<span
						className="badge badge-sm"
						style={{ backgroundColor: getCategoryColor(transaction.category) }}
					>
						{getCategoryName(transaction.category)}
					</span>
				</td>
				<td
					className={`font-mono font-bold ${transaction.amount >= 0 ? "text-success" : "text-error"}`}
				>
					{formatCurrency(transaction.amount)}
				</td>
				<td className="text-xs">{getRecurringLabel(transaction)}</td>
				<td>
					<div className="flex gap-1">
						{onComplete && !transaction.completed && (
							<button
								onClick={() => setShowCompleteConfirm(true)}
								className="btn btn-ghost btn-xs"
								title="Markeren als voltooid"
							>
								✓
							</button>
						)}
						{onEdit && (
							<button
								onClick={() => onEdit(transaction)}
								className="btn btn-ghost btn-xs"
							>
								✏️
							</button>
						)}
						{onDelete && (
							<button
								onClick={() => setShowDeleteConfirm(true)}
								className="btn btn-ghost btn-xs text-error"
							>
								🗑️
							</button>
						)}
					</div>
				</td>
			</tr>

			{showCompleteConfirm && (
				<ConfirmModal
					title="Markeren als voltooid"
					message={`Weet je zeker dat je "${transaction.description}" als voltooid wilt markeren?`}
					confirmLabel="Ja, markeren"
					cancelLabel="Annuleren"
					type="info"
					onConfirm={handleComplete}
					onCancel={() => setShowCompleteConfirm(false)}
				/>
			)}

			{showDeleteConfirm && (
				<ConfirmModal
					title="Transactie verwijderen"
					message={`Weet je zeker dat je "${transaction.description}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
					confirmLabel="Ja, verwijderen"
					cancelLabel="Annuleren"
					type="danger"
					onConfirm={handleDelete}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			)}
		</>
	);
}
