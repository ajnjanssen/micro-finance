"use client";

import { useState } from "react";
import { useCategorySpending } from "@/hooks/useCategorySpending";
import { formatCurrency } from "@/utils/formatters";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";

export default function CategoriesPage() {
  const { spending, categories, loading } = useCategorySpending();
  const [sortBy, setSortBy] = useState<"total" | "count" | "name">("total");

  const sortedSpending = [...spending].sort((a, b) => {
    if (sortBy === "total") return b.total - a.total;
    if (sortBy === "count") return b.count - a.count;
    return a.category.localeCompare(b.category);
  });

  const totalSpending = spending.reduce((sum, cat) => sum + cat.total, 0);

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Categorieën</h1>

        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Totaal Uitgaven</h2>
            <div className="text-2xl font-bold text-error">
              {formatCurrency(totalSpending)}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button className={`btn btn-sm ${sortBy === "total" ? "btn-primary" : "btn-outline"}`} onClick={() => setSortBy("total")}>Bedrag</button>
            <button className={`btn btn-sm ${sortBy === "count" ? "btn-primary" : "btn-outline"}`} onClick={() => setSortBy("count")}>Aantal</button>
            <button className={`btn btn-sm ${sortBy === "name" ? "btn-primary" : "btn-outline"}`} onClick={() => setSortBy("name")}>Naam</button>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Categorie</th>
                  <th>Totaal</th>
                  <th>Transacties</th>
                </tr>
              </thead>
              <tbody>
                {sortedSpending.map((cat) => (
                  <tr key={cat.category}>
                    <td>{cat.category}</td>
                    <td className="text-error">{formatCurrency(cat.total)}</td>
                    <td>{cat.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
