import { useState, useEffect } from "react";
import { FinancialData } from "@/types/finance";

export function useFinancialData() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFinancialData = async () => {
    try {
      const [financeResponse, categoriesResponse] = await Promise.all([
        fetch("/api/finance"),
        fetch("/api/settings/categories"),
      ]);

      const data = await financeResponse.json();
      const categories = await categoriesResponse.json();

      setFinancialData({
        ...data,
        categories: Array.isArray(categories) ? categories : data.categories || [],
      });
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  return { financialData, loading, reload: loadFinancialData };
}
