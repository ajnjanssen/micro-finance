"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Transaction, Category } from "@/types/finance";

function CategorizePageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set()
  );
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [pendingTransactionId, setPendingTransactionId] = useState<
    string | null
  >(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState<string>("all");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    loadData();
  }, [categoryParam]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, descriptionFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transRes, catRes] = await Promise.all([
        fetch("/api/settings/transactions"),
        fetch("/api/settings/categories"),
      ]);

      const allTransactions = await transRes.json();
      const allCategories = await catRes.json();

      // Filter transactions by the category parameter
      const filtered = categoryParam
        ? allTransactions.filter(
            (t: Transaction) => t.category === categoryParam
          )
        : allTransactions.filter(
            (t: Transaction) => t.category === "uncategorized"
          );

      console.log(`Filtering by category: "${categoryParam}"`);
      console.log(`Found ${filtered.length} transactions with this category`);

      setTransactions(filtered);
      setCategories(allCategories);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCategorize = async () => {
    if (!selectedCategory || selectedTransactions.size === 0) {
      showToastMessage("Selecteer eerst transacties en een categorie", "error");
      return;
    }

    setIsBulkUpdating(true);
    const totalCount = selectedTransactions.size;
    setBulkProgress({ current: 0, total: totalCount });

    try {
      // Update transactions sequentially to avoid file write conflicts
      let successCount = 0;
      let failCount = 0;

      for (const txId of Array.from(selectedTransactions)) {
        try {
          const response = await fetch("/api/settings/transactions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: txId,
              category: selectedCategory,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to update transaction ${txId}`);
          }
        } catch (err) {
          failCount++;
          console.error(`Error updating transaction ${txId}:`, err);
        }

        // Update progress
        setBulkProgress({
          current: successCount + failCount,
          total: totalCount,
        });
      }

      if (failCount > 0) {
        showToastMessage(
          `${successCount} transacties bijgewerkt, ${failCount} mislukt`,
          "error"
        );
      } else {
        showToastMessage(
          `${successCount} transacties succesvol bijgewerkt!`,
          "success"
        );
      }

      setSelectedTransactions(new Set());
      // Small delay to ensure database writes are complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      loadData();
    } catch (error) {
      console.error("Error updating transactions:", error);
      showToastMessage("Fout bij bijwerken van transacties", "error");
    } finally {
      setIsBulkUpdating(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const toggleTransaction = (txId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(txId)) {
      newSelected.delete(txId);
    } else {
      newSelected.add(txId);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Voer een categorienaam in");
      return;
    }

    setIsCreatingCategory(true);
    try {
      const response = await fetch("/api/settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `cat-${Date.now()}`,
          name: newCategoryName.trim().toLowerCase(),
          type: "expense",
          color: "#3b82f6",
        }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories([...categories, newCategory]);
        setSelectedCategory(newCategory.name);
        setNewCategoryName("");
        setShowNewCategoryModal(false);

        // If triggered from individual transaction dropdown, auto-assign the category
        if (pendingTransactionId) {
          await fetch("/api/settings/transactions", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: pendingTransactionId,
              category: newCategory.name,
            }),
          });
          setPendingTransactionId(null);
          loadData();
        }

        showToastMessage(
          `Categorie "${newCategory.name}" aangemaakt`,
          "success"
        );
      } else {
        const errorData = await response.json();
        showToastMessage(
          errorData.error || "Fout bij aanmaken categorie",
          "error"
        );
      }
    } catch (error) {
      console.error("Error creating category:", error);
      showToastMessage("Fout bij aanmaken categorie", "error");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-base-300 rounded w-1/3"></div>
            <div className="h-64 bg-base-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const categoryName = categoryParam || "uncategorized";
  const totalAmount = transactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );

  // Apply filters
  const filteredTransactions = transactions.filter((tx) => {
    // Search filter
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      if (!tx.description.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Description pattern filter
    if (descriptionFilter !== "all") {
      if (descriptionFilter === "notprovided") {
        if (!tx.description.toLowerCase().includes("notprovided")) {
          return false;
        }
      } else if (descriptionFilter === "has-description") {
        if (
          tx.description.toLowerCase().includes("notprovided") ||
          tx.description.length < 5
        ) {
          return false;
        }
      }
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    endIndex
  );

  const filteredTotalAmount = filteredTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <a
              href="/?tab=budget"
              className="text-sm text-primary hover:underline mb-2 inline-block"
            >
              ← Terug naar Budget
            </a>
            <h1 className="text-3xl font-bold">Categoriseer Transacties</h1>
            <p className="text-base-content/70">
              <span className="badge badge-lg badge-warning font-mono mr-2">
                {categoryName}
              </span>
              {filteredTransactions.length !== transactions.length && (
                <>
                  {filteredTransactions.length} van {transactions.length}{" "}
                  transacties
                </>
              )}
              {filteredTransactions.length === transactions.length && (
                <>{transactions.length} transacties</>
              )}{" "}
              • €{filteredTotalAmount.toFixed(2)} totaal
              {totalPages > 1 && (
                <span className="ml-2 opacity-60">
                  (Pagina {currentPage}/{totalPages})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-sm mb-2">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Zoek in beschrijving</span>
                </label>
                <input
                  type="text"
                  placeholder="Typ om te zoeken..."
                  className="input input-bordered input-sm"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Beschrijving type</span>
                </label>
                <select
                  className="select select-bordered select-sm "
                  value={descriptionFilter}
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                >
                  <option value="all">Alle transacties</option>
                  <option value="notprovided">Alleen "notprovided"</option>
                  <option value="has-description">
                    Alleen met echte beschrijving
                  </option>
                </select>
              </div>
            </div>

            {(searchFilter || descriptionFilter !== "all") && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
                <div className="text-sm">
                  <span className="font-semibold">
                    {filteredTransactions.length}
                  </span>{" "}
                  transacties gevonden • €{filteredTotalAmount.toFixed(2)}{" "}
                  totaal
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setSearchFilter("");
                    setDescriptionFilter("all");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedTransactions.size > 0 && (
          <div className="bg-base-200">
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold">
                {selectedTransactions.size} transactie
                {selectedTransactions.size > 1 ? "s" : ""} geselecteerd
              </span>
              <div className="flex gap-2 items-center">
                <select
                  className="select select-bordered select-sm text-base-content min-w-40 px-2"
                  value={selectedCategory}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setPendingTransactionId(null); // Clear pending ID for bulk action
                      setShowNewCategoryModal(true);
                    } else {
                      setSelectedCategory(e.target.value);
                    }
                  }}
                >
                  <option value="">Kies categorie...</option>
                  {categories
                    .filter((c) => c.type === "expense")
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  <option value="__ADD_NEW__" className="font-semibold">
                    + Nieuwe categorie toevoegen
                  </option>
                </select>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleBulkCategorize}
                  disabled={!selectedCategory || isBulkUpdating}
                >
                  {isBulkUpdating ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Bijwerken...
                    </>
                  ) : (
                    "Categoriseer"
                  )}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedTransactions(new Set())}
                  disabled={isBulkUpdating}
                >
                  Annuleer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={
                          selectedTransactions.size ===
                            filteredTransactions.length &&
                          filteredTransactions.length > 0
                        }
                        onChange={toggleAll}
                      />
                    </th>
                    <th>Datum</th>
                    <th>Beschrijving</th>
                    <th>Bedrag</th>
                    <th>Huidige Categorie</th>
                    <th>Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-base-content/50"
                      >
                        Geen transacties gevonden in deze categorie
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className={
                          selectedTransactions.has(tx.id) ? "bg-primary/10" : ""
                        }
                      >
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedTransactions.has(tx.id)}
                            onChange={() => toggleTransaction(tx.id)}
                          />
                        </td>
                        <td>
                          {new Date(tx.date).toLocaleDateString("nl-NL", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td>
                          <div className="max-w-md">
                            <div className="font-medium">{tx.description}</div>
                            {tx.categoryReason && (
                              <div className="text-xs opacity-60 mt-1">
                                {tx.categoryReason}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`font-mono ${
                              tx.amount < 0 ? "text-error" : "text-success"
                            }`}
                          >
                            €{Math.abs(tx.amount).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-sm">{tx.category}</span>
                        </td>
                        <td>
                          <select
                            className="select select-bordered select-xs"
                            value=""
                            onChange={async (e) => {
                              if (e.target.value === "__ADD_NEW__") {
                                setPendingTransactionId(tx.id);
                                setShowNewCategoryModal(true);
                              } else if (e.target.value) {
                                const response = await fetch(
                                  "/api/settings/transactions",
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      id: tx.id,
                                      category: e.target.value,
                                    }),
                                  }
                                );
                                if (response.ok) {
                                  showToastMessage(
                                    "Transactie bijgewerkt",
                                    "success"
                                  );
                                  // Small delay to ensure database write is complete
                                  await new Promise((resolve) =>
                                    setTimeout(resolve, 100)
                                  );
                                  loadData();
                                } else {
                                  showToastMessage(
                                    "Fout bij bijwerken transactie",
                                    "error"
                                  );
                                }
                              }
                            }}
                          >
                            <option value="">Wijzig...</option>
                            {categories
                              .filter((c) => c.type === "expense")
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}
                            <option
                              value="__ADD_NEW__"
                              className="font-semibold"
                            >
                              + Nieuwe categorie
                            </option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
                <div className="text-sm text-base-content/70">
                  Pagina {currentPage} van {totalPages} •{" "}
                  {filteredTransactions.length}{" "}
                  {filteredTransactions.length !== transactions.length && (
                    <>(van {transactions.length})</>
                  )}{" "}
                  transacties
                </div>
                <div className="btn-group">
                  <button
                    className="btn btn-sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    «
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`btn btn-sm ${
                          currentPage === pageNum ? "btn-active" : ""
                        }`}
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    className="btn btn-sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Category Modal */}
        {showNewCategoryModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">
                Nieuwe Categorie Toevoegen
              </h3>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Categorienaam</span>
                </label>
                <input
                  type="text"
                  placeholder="Bijv. entertainment, transport, groceries"
                  className="input input-bordered"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateCategory();
                    }
                  }}
                  autoFocus
                />
                <label className="label">
                  <span className="label-text-alt">
                    Gebruik kleine letters en geen spaties
                  </span>
                </label>
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-primary"
                  onClick={handleCreateCategory}
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                >
                  {isCreatingCategory ? "Bezig..." : "Toevoegen"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowNewCategoryModal(false);
                    setNewCategoryName("");
                    setPendingTransactionId(null);
                  }}
                  disabled={isCreatingCategory}
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Modal */}
        {isBulkUpdating && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Transacties Bijwerken</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Voortgang</span>
                  <span className="font-mono font-bold">
                    {bulkProgress.current} / {bulkProgress.total}
                  </span>
                </div>
                <progress
                  className="progress progress-primary w-full"
                  value={bulkProgress.current}
                  max={bulkProgress.total}
                ></progress>
                <p className="text-sm text-base-content/70 text-center">
                  Even geduld, transacties worden bijgewerkt...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div className="toast toast-end">
            <div
              className={`alert ${
                toastType === "success"
                  ? "alert-success"
                  : toastType === "error"
                  ? "alert-error"
                  : "alert-info"
              }`}
            >
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategorizePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <CategorizePageContent />
    </Suspense>
  );
}
