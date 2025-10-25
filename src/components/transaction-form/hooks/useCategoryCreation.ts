import { useState } from "react";

export function useCategoryCreation(
	formType: "income" | "expense",
	onCategoryCreated?: () => Promise<void>,
	onCategorySelected?: (categoryId: string) => void,
) {
	const [isCreating, setIsCreating] = useState(false);
	const [newName, setNewName] = useState("");
	const [newColor, setNewColor] = useState("#3b82f6");

	const handleCreate = async () => {
		if (!newName.trim()) return;

		try {
			const response = await fetch("/api/settings/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: newName,
					type: formType,
					color: newColor,
				}),
			});

			if (response.ok) {
				const newCategory = await response.json();

				if (onCategoryCreated) {
					await onCategoryCreated();
				}

				if (onCategorySelected) {
					onCategorySelected(newCategory.id);
				}

				setIsCreating(false);
				setNewName("");
				setNewColor("#3b82f6");
			}
		} catch (error) {
			console.error("Error creating category:", error);
		}
	};

	return {
		isCreating,
		setIsCreating,
		newName,
		setNewName,
		newColor,
		setNewColor,
		handleCreate,
	};
}
