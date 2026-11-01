import { useEffect, useState } from "react";
import { getSavingsGoalCurrentAmount } from "@/services/savings-goal-progress";
import type { Transaction } from "@/types/finance-v2";
import type { SavingsGoal } from "@/types/savings-goals";

export function useSavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      // Load both goals and transactions in parallel
      const [goalsResponse, transactionsResponse] = await Promise.all([
        fetch("/api/savings-goals"),
        fetch("/api/finance"),
      ]);

      const goalsData = await goalsResponse.json();
      const transactionsData = await transactionsResponse.json();

      const loadedGoals = Array.isArray(goalsData)
        ? goalsData
        : goalsData.goals || [];
      const transactions: Transaction[] = transactionsData.transactions || [];
      const accounts = transactionsData.accounts || [];

      const goalsWithProgress = loadedGoals.map((goal: SavingsGoal) => {
        return {
          ...goal,
          currentAmount: getSavingsGoalCurrentAmount(
            goal,
            transactions,
            accounts,
            loadedGoals,
          ),
        };
      });

      setGoals(goalsWithProgress);
      setTransactions(transactions);
      setAccounts(accounts);
    } catch (error) {
      console.error("Error loading savings goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (
    goal: Omit<SavingsGoal, "id" | "createdAt" | "updatedAt" | "currentAmount">,
  ) => {
    try {
      const response = await fetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      });

      if (response.ok) {
        await loadGoals();
        return true;
      }
    } catch (error) {
      console.error("Error adding goal:", error);
    }
    return false;
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
        return true;
      }
    } catch (error) {
      console.error("Error updating goal:", error);
    }
    return false;
  };

  const deleteGoal = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit spaardoel wilt verwijderen?"))
      return false;

    try {
      const response = await fetch(`/api/savings-goals/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadGoals();
        return true;
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
    return false;
  };

  return {
    goals,
    transactions,
    accounts,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    reload: loadGoals,
  };
}
