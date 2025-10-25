import { useState } from "react";
import type { IncomeSource } from "@/types/financial-config";

const DEFAULT_FORM_DATA = {
	name: "",
	amount: "",
	frequency: "monthly" as IncomeSource["frequency"],
	dayOfMonth: "",
	startDate: new Date().toISOString().split("T")[0],
	category: "salary" as IncomeSource["category"],
	notes: "",
};

export function useIncomeForm(
	onAdd: (income: Omit<IncomeSource, "id">) => void,
) {
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onAdd({
			name: formData.name,
			amount: parseFloat(formData.amount) || 0,
			frequency: formData.frequency,
			dayOfMonth: formData.dayOfMonth
				? parseInt(formData.dayOfMonth)
				: undefined,
			startDate: formData.startDate,
			isActive: true,
			category: formData.category,
			notes: formData.notes || undefined,
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
