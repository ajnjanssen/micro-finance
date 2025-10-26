import { useState, useEffect } from "react";
import { Transaction, Category } from "@/types/finance";

interface CategorySpending {
  category: string;
  total: number;
  count: number;
  monthlyBreakdown: { month: string; amount: number; count: number }[];
}

export function useCategorySpending() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [unusedCategories, setUnusedCategories] = useState<Category[]>([]);
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

    // Create a map for quick category lookup
    const categoryMap = new Map(catData.map((cat) => [cat.id, cat.name]));

    // Get all unique category IDs used in transactions (not just expenses)
    const usedCategoryIds = new Set(txData.map((tx) => tx.category));

    txData
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        // Use category name instead of ID
        const categoryName = categoryMap.get(tx.category) || tx.category;

        const existing = spendingMap.get(categoryName) || {
          category: categoryName,
          total: 0,
          count: 0,
          monthlyBreakdown: [],
        };

        existing.total += tx.amount;
        existing.count += 1;
        spendingMap.set(categoryName, existing);
      });

    setSpending(Array.from(spendingMap.values()));

    // Track which categories are unused (no transactions at all, not even income/transfers)
    const unused = catData.filter((cat) => !usedCategoryIds.has(cat.id));
    setUnusedCategories(unused);
  };

  return {
    transactions,
    categories,
    spending,
    unusedCategories,
    loading,
    reload: loadData,
  };
}
