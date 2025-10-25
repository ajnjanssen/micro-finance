import { useState, useEffect } from "react";
import type { SavingsGoal } from "@/types/savings-goals";

export function useSavingsGoals() {
	const [goals, setGoals] = useState<SavingsGoal[]>([]);
	const [loading, setLoading] = useState(true);

	const loadGoals = async () => {
		try {
			const response = await fetch("/api/savings-goals");
			const data = await response.json();
			setGoals(data.goals || []);
		} catch (error) {
			console.error("Error loading goals:", error);
		} finally {
			setLoading(false);
		}
	};

	const addGoal = async (goal: Omit<SavingsGoal, "id" | "createdAt" | "updatedAt">) => {
		try {
			const response = await fetch("/api/savings-goals", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(goal),
			});
			if (response.ok) {
				await loadGoals();
			}
		} catch (error) {
			console.error("Error adding goal:", error);
		}
	};

	const updateGoal = async (id: string, updates: Partial<SavingsGoal>) => {
		try {
			const response = await fetch(`/api/savings-goals/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			});
			if (response.ok) {
				await loadGoals();
			}
		} catch (error) {
			console.error("Error updating goal:", error);
		}
	};

	const deleteGoal = async (id: string) => {
		try {
			const response = await fetch(`/api/savings-goals/${id}`, {
				method: "DELETE",
			});
			if (response.ok) {
				await loadGoals();
			}
		} catch (error) {
			console.error("Error deleting goal:", error);
		}
	};

	useEffect(() => {
		loadGoals();
	}, []);

	return { goals, loading, addGoal, updateGoal, deleteGoal, reload: loadGoals };
}
