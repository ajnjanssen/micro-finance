import { useState, useEffect } from "react";
import { Transaction, Category } from "@/types/finance";

interface CategorySpending {
  category: string;
  total: number;
  count: number;
  monthlyBreakdown: { month: string; amount: number; count: number; }[];
}

export function useCategorySpending() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txRes, catRes] = await Promise.all([
        fetch("/api/settings/transactions"),
        fetch("/api/settings/categories"),
      ]);

      const txData = await txRes.json();
      const catData = await catRes.json();

      setTransactions(Array.isArray(txData) ? txData : []);
      setCategories(Array.isArray(catData) ? catData : []);

      calculateSpending(txData, catData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSpending = (txData: Transaction[], catData: Category[]) => {
    const spendingMap = new Map<string, CategorySpending>();

    txData.filter((tx) => tx.type === "expense").forEach((tx) => {
      const existing = spendingMap.get(tx.category) || {
        category: tx.category,
        total: 0,
        count: 0,
        monthlyBreakdown: [],
      };

      existing.total += tx.amount;
      existing.count += 1;
      spendingMap.set(tx.category, existing);
    });

    setSpending(Array.from(spendingMap.values()));
  };

  return { transactions, categories, spending, loading, reload: loadData };
}
