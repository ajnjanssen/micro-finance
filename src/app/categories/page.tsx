"use client";

import { useState } from "react";
import { useCategorySpending } from "@/hooks/useCategorySpending";
import { formatCurrency } from "@/utils/formatters";
import LoadingState from "@/components/ui/LoadingState";
import Link from "next/link";

export default function CategoriesPage() {
  const { spending, categories, unusedCategories, loading } =
    useCategorySpending();
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
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Categorieën</h1>
          <Link href="/settings?tab=categories" className="btn btn-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Categorieën Beheren
          </Link>
        </div>

        {/* Summary Card */}
        <div className="card bg-base-200 shadow mb-6">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Totaal Uitgaven</h2>
                <p className="text-sm text-base-content/70">
                  Alle categorieën gecombineerd
                </p>
              </div>
              <div className="text-3xl font-bold text-error">
                {formatCurrency(totalSpending)}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="stat bg-base-100 rounded-lg">
                <div className="stat-title">Categorieën</div>
                <div className="stat-value text-primary">
                  {categories.length}
                </div>
                <div className="stat-desc">Totaal aantal</div>
              </div>
              <div className="stat bg-base-100 rounded-lg">
                <div className="stat-title">Actieve Categorieën</div>
                <div className="stat-value text-secondary">
                  {spending.length}
                </div>
                <div className="stat-desc">Met transacties</div>
              </div>
              <div className="stat bg-base-100 rounded-lg">
                <div className="stat-title">Gemiddeld per Categorie</div>
                <div className="stat-value text-accent text-2xl">
                  {formatCurrency(totalSpending / (spending.length || 1))}
                </div>
                <div className="stat-desc">Totaal / Actieve</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sorting Options and Table */}
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Categorie Overzicht</h3>
              <div className="flex gap-2">
                <button
                  className={`btn btn-sm ${
                    sortBy === "total" ? "btn-primary" : "btn-outline"
                  }`}
                  onClick={() => setSortBy("total")}
                >
                  💰 Bedrag
                </button>
                <button
                  className={`btn btn-sm ${
                    sortBy === "count" ? "btn-primary" : "btn-outline"
                  }`}
                  onClick={() => setSortBy("count")}
                >
                  📊 Aantal
                </button>
                <button
                  className={`btn btn-sm ${
                    sortBy === "name" ? "btn-primary" : "btn-outline"
                  }`}
                  onClick={() => setSortBy("name")}
                >
                  🔤 Naam
                </button>
              </div>
            </div>

            {/* Categories Table */}
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Categorie</th>
                    <th>Totaal</th>
                    <th>Transacties</th>
                    <th>Gemiddeld per Transactie</th>
                    <th>Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSpending.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-base-content/30"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-base-content/70">
                            Geen transacties met categorieën gevonden
                          </p>
                          <Link
                            href="/transactions"
                            className="btn btn-sm btn-primary mt-2"
                          >
                            Transacties Bekijken
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedSpending.map((cat) => (
                      <tr key={cat.category} className="hover">
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {cat.category}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="font-bold text-error">
                            {formatCurrency(cat.total)}
                          </span>
                        </td>
                        <td>
                          <div className="badge badge-neutral">{cat.count}</div>
                        </td>
                        <td>
                          <span className="text-sm">
                            {formatCurrency(cat.total / cat.count)}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Link
                              href={`/transactions?category=${encodeURIComponent(
                                cat.category
                              )}`}
                              className="btn btn-xs btn-ghost"
                              title="Bekijk transacties"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Link>
                            <Link
                              href="/settings?tab=categories"
                              className="btn btn-xs btn-ghost"
                              title="Bewerk categorie"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Empty Categories Notice */}
            {unusedCategories.length > 0 && (
              <div className="alert alert-info mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex flex-col gap-2">
                  <span>
                    <strong>{unusedCategories.length}</strong>{" "}
                    {unusedCategories.length === 1
                      ? "categorie heeft"
                      : "categorieën hebben"}{" "}
                    nog geen transacties:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {unusedCategories.map((cat) => (
                      <div key={cat.id} className="badge badge-outline">
                        {cat.name}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 text-sm mt-2">
                    <Link
                      href="/settings?tab=categories"
                      className="link link-hover font-semibold"
                    >
                      → Beheer categorieën
                    </Link>
                    <span className="text-base-content/60">
                      (bekijk, bewerk of verwijder ongebruikte categorieën)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
