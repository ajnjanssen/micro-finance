"use client";

import { useState } from "react";
import type { Transaction, Account, Category } from "@/types/finance";
import { useTransactionFormState } from "./hooks/useFormState";
import { useCategoryCreation } from "./hooks/useCategoryCreation";

interface TransactionFormProps {
	accounts: Account[];
	categories: Category[];
	accountBalances: { [accountId: string]: number };
	onSubmit: (transaction: Omit<Transaction, "id">) => Promise<void>;
	onCancel: () => void;
	editTransaction?: Transaction;
	onCategoryCreated?: () => Promise<void>;
}

export default function TransactionForm({
	accounts,
	categories,
	accountBalances,
	onSubmit,
	onCancel,
	editTransaction,
	onCategoryCreated,
}: TransactionFormProps) {
	const { formData, setFormData, isSubmitting, setIsSubmitting } =
		useTransactionFormState(accounts, editTransaction);

	const categoryCreation = useCategoryCreation(
		formData.type,
		onCategoryCreated,
		(categoryId) => setFormData({ ...formData, category: categoryId }),
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const transaction: Omit<Transaction, "id"> = {
				description: formData.description,
				amount:
					formData.type === "expense"
						? -Math.abs(parseFloat(formData.amount))
						: Math.abs(parseFloat(formData.amount)),
				type: formData.type,
				category: formData.category,
				accountId: formData.accountId,
				toAccountId: formData.type === "transfer" ? formData.toAccountId : undefined,
				date: formData.date,
				completed: false,
				isRecurring: formData.isRecurring,
				recurringType: formData.isRecurring
					? formData.recurringType
					: undefined,
				recurringEndDate: formData.isRecurring
					? formData.recurringEndDate
					: undefined,
				tags: formData.tags
					? formData.tags.split(",").map((tag) => tag.trim())
					: [],
			};

			await onSubmit(transaction);
		} catch (error) {
			console.error("Error submitting transaction:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const filteredCategories = categories.filter(
		(cat) => cat.type === formData.type,
	);

	return (
		<div className="card p-6">
			<h3 className="text-lg font-semibold mb-4 text-primary">
				{editTransaction ? "Transactie Bewerken" : "Nieuwe Transactie"}
			</h3>

			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Type & Amount */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="label-text">Type</label>
						<select
							value={formData.type}
							onChange={(e) =>
								setFormData({
									...formData,
									type: e.target.value as "income" | "expense" | "transfer",
									category: "",
								})
							}
							className="select select-bordered w-full"
							required
						>
							<option value="expense">Uitgave</option>
							<option value="income">Inkomst</option>
							<option value="transfer">Overboeking</option>
						</select>
					</div>

					<div>
						<label className="label-text">Bedrag (€)</label>
						<input
							type="number"
							step="0.01"
							value={formData.amount}
							onChange={(e) =>
								setFormData({ ...formData, amount: e.target.value })
							}
							className="input input-bordered w-full"
							required
						/>
					</div>
				</div>

				{/* Description */}
				<div>
					<label className="label-text">Beschrijving</label>
					<input
						type="text"
						value={formData.description}
						onChange={(e) =>
							setFormData({ ...formData, description: e.target.value })
						}
						className="input input-bordered w-full"
						required
					/>
				</div>

				{/* Category */}
				<div>
					<label className="label-text">Categorie</label>
					<div className="flex gap-2">
						<select
							value={formData.category}
							onChange={(e) =>
								e.target.value === "__new__"
									? categoryCreation.setIsCreating(true)
									: setFormData({ ...formData, category: e.target.value })
							}
							className="select select-bordered flex-1"
							required
						>
							<option value="">Selecteer categorie</option>
							{filteredCategories.map((cat) => (
								<option key={cat.id} value={cat.id}>
									{cat.name}
								</option>
							))}
							<option value="__new__">+ Nieuwe Categorie</option>
						</select>
					</div>
				</div>

				{/* Category Creation Modal */}
				{categoryCreation.isCreating && (
					<div className="card bg-base-200 p-4">
						<input
							type="text"
							value={categoryCreation.newName}
							onChange={(e) => categoryCreation.setNewName(e.target.value)}
							className="input input-bordered mb-2"
							placeholder="Categorie naam"
						/>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={categoryCreation.handleCreate}
								className="btn btn-primary btn-sm"
							>
								Aanmaken
							</button>
							<button
								type="button"
								onClick={() => categoryCreation.setIsCreating(false)}
								className="btn btn-ghost btn-sm"
							>
								Annuleren
							</button>
						</div>
					</div>
				)}

				{/* Account & Date */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="label-text">
							{formData.type === "transfer" ? "Van Rekening" : "Rekening"}
						</label>
						<select
							value={formData.accountId}
							onChange={(e) =>
								setFormData({ ...formData, accountId: e.target.value })
							}
							className="select select-bordered w-full"
							required
						>
							{accounts.map((acc) => (
								<option key={acc.id} value={acc.id}>
									{acc.name}
								</option>
							))}
						</select>
					</div>

					{formData.type === "transfer" && (
						<div>
							<label className="label-text">Naar Rekening</label>
							<select
								value={formData.toAccountId}
								onChange={(e) =>
									setFormData({ ...formData, toAccountId: e.target.value })
								}
								className="select select-bordered w-full"
								required
							>
								<option value="">Selecteer rekening</option>
								{accounts
									.filter((acc) => acc.id !== formData.accountId)
									.map((acc) => (
										<option key={acc.id} value={acc.id}>
											{acc.name}
										</option>
									))}
							</select>
						</div>
					)}

					<div>
						<label className="label-text">Datum</label>
						<input
							type="date"
							value={formData.date}
							onChange={(e) =>
								setFormData({ ...formData, date: e.target.value })
							}
							className="input input-bordered w-full"
							required
						/>
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-2 pt-4">
					<button
						type="button"
						onClick={onCancel}
						className="btn btn-ghost flex-1"
					>
						Annuleren
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="btn btn-primary flex-1"
					>
						{isSubmitting ? "Bezig..." : "Opslaan"}
					</button>
				</div>
			</form>
		</div>
	);
}
