import { useState, useEffect } from "react";
import type { SavingsGoal } from "@/types/savings-goals";
import type { Transaction } from "@/types/finance-v2";

export function useSavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      
      const loadedGoals = Array.isArray(goalsData) ? goalsData : goalsData.goals || [];
      const transactions: Transaction[] = transactionsData.transactions || [];

      // Calculate currentAmount for each goal based on linked transactions
      const goalsWithProgress = loadedGoals.map((goal: SavingsGoal) => {
        const linkedTransactions = transactions.filter(
          (t) => t.savingsGoalId === goal.id
        );
        
        // Sum up all linked savings transactions (they should be positive amounts)
        const totalSaved = linkedTransactions.reduce(
          (sum, t) => sum + Math.abs(t.amount),
          0
        );

        return {
          ...goal,
          currentAmount: totalSaved,
        };
      });

      setGoals(goalsWithProgress);
      setTransactions(transactions);
    } catch (error) {
      console.error("Error loading savings goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goal: Omit<SavingsGoal, "id" | "createdAt" | "updatedAt" | "currentAmount">) => {
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

  const deleteGoal = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit spaardoel wilt verwijderen?")) return false;

    try {
      const response = await fetch(`/api/savings-goals/${id}`, { method: "DELETE" });
      if (response.ok) {
        await loadGoals();
        return true;
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
    return false;
  };

  return { goals, transactions, loading, addGoal, deleteGoal, reload: loadGoals };
}
