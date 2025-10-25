import { useState } from "react";
import type { Account } from "@/types/finance";

const DEFAULT_FORM_DATA = {
	name: "",
	type: "checking" as Account["type"],
	startingBalance: "",
	startDate: new Date().toISOString().split("T")[0],
	description: "",
};

export function useAccountForm(
	onAdd: (account: Omit<Account, "id">) => void,
) {
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onAdd({
			name: formData.name,
			type: formData.type,
			startingBalance: parseFloat(formData.startingBalance) || 0,
			startDate: formData.startDate,
			description: formData.description || undefined,
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
