import { useState } from "react";
import type { RecurringExpense } from "@/types/financial-config";

const DEFAULT_FORM_DATA = {
	name: "",
	category: "rent",
	amount: "",
	frequency: "monthly" as RecurringExpense["frequency"],
	startDate: new Date().toISOString().split("T")[0],
	isEssential: true,
	isVariable: false,
};

export function useExpenseForm(
	onAdd: (expense: Omit<RecurringExpense, "id">) => void,
) {
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onAdd({
			name: formData.name,
			category: formData.category,
			amount: parseFloat(formData.amount) || 0,
			frequency: formData.frequency,
			startDate: formData.startDate,
			isActive: true,
			isEssential: formData.isEssential,
			isVariable: formData.isVariable,
		});
		setFormData(DEFAULT_FORM_DATA);
		setShowForm(false);
	};

	return {
		showForm,
		formData,
		setShowForm,
		setFormData,
		handleSubmit,
	};
}
