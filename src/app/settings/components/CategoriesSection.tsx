"use client";

import { useState, useEffect } from "react";
import type { Category, Transaction } from "@/types/finance";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { BUDGET_CATEGORIES } from "@/constants/categories";
import Select from "@/components/ui/Select";

interface CategoriesSectionProps {
  categories: Category[];
  transactions: Transaction[];
  onUpdate: () => Promise<void>;
}

export default function CategoriesSection({
  categories,
  transactions,
  onUpdate,
}: CategoriesSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as "income" | "expense" | "transfer",
    color: "primary",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    type: "expense" as "income" | "expense" | "transfer",
    color: "primary",
    budgetMapping: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetCategoryMappings, setBudgetCategoryMappings] = useState<
    Record<string, string[]>
  >({});
  const [unmappedBudgetCategories, setUnmappedBudgetCategories] = useState<
    string[]
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      // Reset form and refresh data
      setFormData({ name: "", type: "expense", color: "primary" });
      setShowCreateForm(false);
      await onUpdate();
    } catch (error) {
      console.error("Error creating category:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create category"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Weet je zeker dat je deze categorie wilt verwijderen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      await onUpdate();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  // Convert hex colors to DaisyUI semantic colors
  const convertHexToDaisyUI = (hexColor: string): string => {
    const colorMap: { [key: string]: string } = {
      "#3b82f6": "primary", // blue
      "#8b5cf6": "secondary", // purple
      "#a855f7": "secondary", // purple
      "#10b981": "accent", // green
      "#22c55e": "success", // green
      "#6b7280": "neutral", // gray
      "#06b6d4": "info", // cyan
      "#0ea5e9": "info", // blue
      "#f59e0b": "warning", // yellow
      "#eab308": "warning", // yellow
      "#ef4444": "error", // red
      "#f97316": "warning", // orange
      "#ec4899": "accent", // pink
      "#cef73b": "warning", // lime/yellow
    };

    return colorMap[hexColor.toLowerCase()] || "primary";
  };

  // Migrate all categories with hex colors to DaisyUI semantic colors
  const migrateCategoryColors = async () => {
    const categoriesToMigrate = categories.filter((cat) =>
      cat.color.startsWith("#")
    );

    if (categoriesToMigrate.length === 0) return;

    for (const category of categoriesToMigrate) {
      const daisyUIColor = convertHexToDaisyUI(category.color);

      try {
        const response = await fetch(
          `/api/settings/categories/${category.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: category.name,
              type: category.type,
              color: daisyUIColor,
            }),
          }
        );

        if (!response.ok) {
          console.error(`Failed to migrate category ${category.name}`);
        }
      } catch (error) {
        console.error(`Error migrating category ${category.name}:`, error);
      }
    }

    // Refresh the data after migration
    await onUpdate();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    // Find current budget mapping for this category
    const currentMapping = Object.entries(budgetCategoryMappings).find(
      ([_, categoryIds]) => categoryIds.includes(category.id)
    );

    setEditFormData({
      name: category.name,
      type: category.type,
      color: category.color, // Should always be DaisyUI semantic color after migration
      budgetMapping: currentMapping ? currentMapping[0] : "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsSubmitting(true);
    try {
      // Update category
      const categoryResponse = await fetch(
        `/api/settings/categories/${editingCategory.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editFormData.name,
            type: editFormData.type,
            color: editFormData.color,
          }),
        }
      );

      if (!categoryResponse.ok) {
        const error = await categoryResponse.json();
        throw new Error(error.error || "Failed to update category");
      }

      // Update budget mapping if changed
      if (editFormData.budgetMapping) {
        const mappingResponse = await fetch("/api/settings/budget-mappings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budgetCategory: editFormData.budgetMapping,
            transactionCategoryId: editingCategory.id,
          }),
        });

        if (!mappingResponse.ok) {
          console.warn("Failed to update budget mapping");
        }
      }

      // Close modal and refresh
      setShowEditModal(false);
      setEditingCategory(null);
      await onUpdate();
      await loadBudgetMappings();
    } catch (error) {
      console.error("Error updating category:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update category"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group categories by type
  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.type]) {
      acc[category.type] = [];
    }
    acc[category.type].push(category);
    return acc;
  }, {} as Record<string, Category[]>);

  const typeLabels = {
    income: "Inkomsten",
    expense: "Uitgaven",
    transfer: "Overboekingen",
  };

  // Find uncategorized transactions
  const categoryIds = new Set(categories.map((c) => c.id));
  const uncategorizedTransactions = transactions.filter(
    (transaction) =>
      !transaction.category ||
      transaction.category === "" ||
      !categoryIds.has(transaction.category)
  );

  const handleAssignCategory = async (
    transactionId: string,
    categoryId: string
  ) => {
    try {
      const response = await fetch(
        `/api/finance/transactions/${transactionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: categoryId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      await onUpdate();
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction category");
    }
  };

  // Load budget category mappings
  const loadBudgetMappings = async () => {
    try {
      const response = await fetch("/api/settings/budget-mappings");
      if (response.ok) {
        const data = await response.json();
        setBudgetCategoryMappings(data.mappings || {});
        setUnmappedBudgetCategories(data.unmappedCategories || []);
      }
    } catch (error) {
      console.error("Error loading budget mappings:", error);
    }
  };

  useEffect(() => {
    loadBudgetMappings();
  }, [categories]);

  // Run color migration on component mount
  useEffect(() => {
    migrateCategoryColors();
  }, []); // Only run once on mount

  const handleUpdateBudgetMapping = async (
    budgetCategory: string,
    transactionCategoryId: string
  ) => {
    try {
      const response = await fetch("/api/settings/budget-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetCategory,
          transactionCategoryId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update budget mapping");
      }

      // Refresh mappings - add to array if not already present
      setBudgetCategoryMappings((prev) => {
        const currentMappings = prev[budgetCategory] || [];
        const updatedMappings = currentMappings.includes(transactionCategoryId)
          ? currentMappings
          : [...currentMappings, transactionCategoryId];

        return {
          ...prev,
          [budgetCategory]: updatedMappings,
        };
      });
      setUnmappedBudgetCategories((prev) =>
        prev.filter((cat) => cat !== budgetCategory)
      );
    } catch (error) {
      console.error("Error updating budget mapping:", error);
      alert("Failed to update budget mapping");
    }
  };

  const budgetCategoryLabels: Record<string, string> = {
    housing: "Wonen (huur, energie, internet)",
    insurance: "Verzekeringen (zorg, auto, aansprakelijkheid)",
    transport: "Vervoer (brandstof, OV, parkeren)",
    groceries: "Boodschappen (supermarkt, huishoudelijk)",
    food: "Eten & Drinken (restaurants, takeaway)",
    entertainment: "Entertainment (streaming, uitgaan, hobby's)",
    shopping: "Winkelen (kleding, elektronica)",
    vacation: "Vakanties (reizen, uitstapjes)",
    savings: "Sparen (spaarrekening, investeringen)",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Categorieën</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          + Nieuwe Categorie
        </button>
      </div>

      {/* Create Category Form */}
      {showCreateForm && (
        <div className="card bg-base-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Nieuwe Categorie</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Naam</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="label-text">Type</label>
                <Select
                  name="categoryType"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "income" | "expense" | "transfer",
                    })
                  }
                  required
                >
                  <option value="expense">Uitgave</option>
                  <option value="income">Inkomst</option>
                  <option value="transfer">Overboeking</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="label-text">Kleur</label>
              <Select
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                required
              >
                <option value="">Selecteer een kleur</option>
                <option value="primary">🔵 Primary (Blauw)</option>
                <option value="secondary">🟣 Secondary (Paars)</option>
                <option value="accent">🟢 Accent (Groen)</option>
                <option value="neutral">⚫ Neutral (Grijs)</option>
                <option value="info">🔷 Info (Lichtblauw)</option>
                <option value="success">✅ Success (Groen)</option>
                <option value="warning">⚠️ Warning (Geel)</option>
                <option value="error">❌ Error (Rood)</option>
              </Select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? "Opslaan..." : "Opslaan"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-ghost"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-6">
        {Object.entries(groupedCategories).map(([type, typeCategories]) => (
          <div key={type} className="card bg-base-100 shadow">
            <div className="card-body p-0">
              <h3 className="card-title">
                {typeLabels[type as keyof typeof typeLabels]}
                <span className="badge badge-neutral">
                  {typeCategories.length}
                </span>
              </h3>

              <div className="grid gap-3">
                {typeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        {!Object.values(budgetCategoryMappings).some(
                          (categoryIds) => categoryIds.includes(category.id)
                        ) && (
                          <div
                            className="tooltip"
                            data-tip="Geen budgettype gekoppeld"
                          >
                            <span className="badge badge-warning ">⚠️</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="btn btn-ghost btn-sm text-primary"
                        title="Bewerken"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="btn btn-ghost btn-sm text-error"
                        title="Verwijderen"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                {typeCategories.length === 0 && (
                  <p className="text-base-content/60 text-center py-4">
                    Geen{" "}
                    {typeLabels[type as keyof typeof typeLabels].toLowerCase()}{" "}
                    categorieën
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mapped Budget Categories */}
      {Object.keys(budgetCategoryMappings).filter(
        (key) => budgetCategoryMappings[key].length > 0
      ).length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-success">
              ✅ Gekoppelde Budget Categorieën
            </h3>
            <p className="text-sm text-base-content/70 mb-4">
              Deze budget categorieën hebben transactie categorieën gekoppeld.
            </p>

            <div className="grid gap-4">
              {Object.entries(budgetCategoryMappings)
                .filter(([_, categoryIds]) => categoryIds.length > 0)
                .map(([budgetCategory, categoryIds]) => (
                  <div
                    key={budgetCategory}
                    className="flex items-start justify-between p-4 bg-base-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-semibold capitalize mb-1">
                        {budgetCategory}
                      </div>
                      <div className="text-sm text-base-content/70 mb-2">
                        {budgetCategoryLabels[budgetCategory]}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categoryIds.map((categoryId) => {
                          const category = categories.find(
                            (c) => c.id === categoryId
                          );
                          return category ? (
                            <span
                              key={categoryId}
                              className={`badge badge-${category.color} gap-2`}
                            >
                              <div className="w-3 h-3 rounded-full bg-current" />
                              {category.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Budget Categories Mapping */}
      {unmappedBudgetCategories.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-info">
              🎯 Budget Categorie Mapping
              <span className="badge badge-info">
                {unmappedBudgetCategories.length}
              </span>
            </h3>
            <p className="text-sm text-base-content/70 mb-4">
              Koppel je transactie categorieën aan standaard budget categorieën
              voor betere budget tracking.
            </p>

            <div className="grid gap-4">
              {unmappedBudgetCategories.map((budgetCategory) => (
                <div
                  key={budgetCategory}
                  className="flex items-center justify-between p-4 bg-base-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold capitalize">
                      {budgetCategory}
                    </div>
                    <div className="text-sm text-base-content/70">
                      {budgetCategoryLabels[budgetCategory]}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">Koppel aan:</span>
                    <Select
                      name={`budget-mapping-${budgetCategory}`}
                      className="select-sm min-w-48"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleUpdateBudgetMapping(
                            budgetCategory,
                            e.target.value
                          );
                        }
                      }}
                    >
                      <option value="">Selecteer categorie</option>
                      {categories.filter((c) => c.type === "income").length >
                        0 && (
                        <optgroup label="Inkomsten">
                          {categories
                            .filter((c) => c.type === "income")
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {categories.filter((c) => c.type === "expense").length >
                        0 && (
                        <optgroup label="Uitgaven">
                          {categories
                            .filter((c) => c.type === "expense")
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {categories.filter((c) => c.type === "transfer").length >
                        0 && (
                        <optgroup label="Overboekingen">
                          {categories
                            .filter((c) => c.type === "transfer")
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Uncategorized Transactions */}
      {uncategorizedTransactions.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-warning">
              ⚠️ Ongecategoriseerde Transacties
              <span className="badge badge-warning">
                {uncategorizedTransactions.length}
              </span>
            </h3>
            <p className="text-sm text-base-content/70 mb-4">
              Deze transacties hebben geen geldige categorie toegewezen. Wijs
              een categorie toe om ze te organiseren.
            </p>

            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Beschrijving</th>
                    <th>Bedrag</th>
                    <th>Huidige Categorie</th>
                    <th>Nieuwe Categorie</th>
                    <th>Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {uncategorizedTransactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="text-xs">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="max-w-xs truncate">
                        {transaction.description}
                      </td>
                      <td
                        className={`font-mono text-xs ${
                          transaction.amount >= 0
                            ? "text-success"
                            : "text-error"
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="text-xs">
                        <span className="badge badge-ghost ">
                          {transaction.category || "Geen categorie"}
                        </span>
                      </td>
                      <td>
                        <Select
                          name={`category-${transaction.id}`}
                          className="select-xs"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignCategory(
                                transaction.id,
                                e.target.value
                              );
                            }
                          }}
                        >
                          <option value="">Selecteer categorie</option>
                          {categories
                            .filter((c) => c.type === transaction.type)
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </Select>
                      </td>
                      <td>
                        <button
                          onClick={() =>
                            handleAssignCategory(transaction.id, "")
                          }
                          className="btn btn-ghost btn-xs"
                          title="Reset categorie"
                        >
                          🔄
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {uncategorizedTransactions.length > 10 && (
                <div className="text-center mt-4">
                  <p className="text-sm text-base-content/70">
                    En nog {uncategorizedTransactions.length - 10} meer
                    ongecategoriseerde transacties...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-base-content/60 mb-4">Geen categorieën gevonden</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Maak je eerste categorie aan
          </button>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Categorie bewerken</h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label-text">Naam</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="label-text">Type</label>
                  <Select
                    value={editFormData.type}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        type: e.target.value as
                          | "income"
                          | "expense"
                          | "transfer",
                      })
                    }
                    required
                  >
                    <option value="expense">Uitgave</option>
                    <option value="income">Inkomst</option>
                    <option value="transfer">Overboeking</option>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="label-text">Kleur</label>
                  <Select
                    value={editFormData.color}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        color: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Selecteer een kleur</option>
                    <option value="primary">🔵 Primary (Blauw)</option>
                    <option value="secondary">🟣 Secondary (Paars)</option>
                    <option value="accent">🟢 Accent (Groen)</option>
                    <option value="neutral">⚫ Neutral (Grijs)</option>
                    <option value="info">🔷 Info (Lichtblauw)</option>
                    <option value="success">✅ Success (Groen)</option>
                    <option value="warning">⚠️ Warning (Geel)</option>
                    <option value="error">❌ Error (Rood)</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="label-text">Budgettype (optioneel)</label>
                <Select
                  value={editFormData.budgetMapping}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      budgetMapping: e.target.value,
                    })
                  }
                >
                  <option value="">Geen budgettype</option>
                  <option value="housing">🏠 Housing (Wonen)</option>
                  <option value="insurance">
                    🛡️ Insurance (Verzekeringen)
                  </option>
                  <option value="transport">🚗 Transport (Vervoer)</option>
                  <option value="groceries">🛒 Groceries (Boodschappen)</option>
                  <option value="food">🍽️ Food (Eten)</option>
                  <option value="entertainment">
                    🎭 Entertainment (Vermaak)
                  </option>
                  <option value="shopping">🛍️ Shopping (Winkelen)</option>
                  <option value="vacation">✈️ Vacation (Vakantie)</option>
                  <option value="savings">💰 Savings (Sparen)</option>
                </Select>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                  }}
                  className="btn btn-ghost"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? "Opslaan..." : "Opslaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
