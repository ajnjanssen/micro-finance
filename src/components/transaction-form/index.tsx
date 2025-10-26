"use client";

import { useState, useRef } from "react";
import type { Transaction, Account, Category } from "@/types/finance";
import { useTransactionFormState } from "./hooks/useFormState";
import { useCategoryCreation } from "./hooks/useCategoryCreation";
import Select from "@/components/ui/Select";

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  accountBalances: { [accountId: string]: number };
  onSubmit: (transaction: Omit<Transaction, "id">) => Promise<void>;
  onCancel: () => void;
  editTransaction?: Transaction;
  onCategoryCreated?: () => Promise<void>;
}

export default function TransactionForm({
  accounts,
  categories,
  accountBalances,
  onSubmit,
  onCancel,
  editTransaction,
  onCategoryCreated,
}: TransactionFormProps) {
  const { formData, setFormData, isSubmitting, setIsSubmitting } =
    useTransactionFormState(accounts, editTransaction);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Map category colors to DaisyUI status classes
  const getCategoryStatusClass = (color: string) => {
    const colorLower = color.toLowerCase();

    if (colorLower.includes("#ef4444") || colorLower.includes("red"))
      return "status-error";
    if (colorLower.includes("#f97316") || colorLower.includes("orange"))
      return "status-warning";
    if (colorLower.includes("#eab308") || colorLower.includes("yellow"))
      return "status-warning";
    if (colorLower.includes("#22c55e") || colorLower.includes("green"))
      return "status-success";
    if (colorLower.includes("#3b82f6") || colorLower.includes("blue"))
      return "status-info";
    if (
      colorLower.includes("#8b5cf6") ||
      colorLower.includes("#a855f7") ||
      colorLower.includes("purple")
    )
      return "status-secondary";
    if (colorLower.includes("#ec4899") || colorLower.includes("pink"))
      return "status-accent";

    return "status-primary";
  };

  const categoryCreation = useCategoryCreation(
    formData.type === "transfer" ? "expense" : formData.type,
    onCategoryCreated,
    (categoryId) => setFormData({ ...formData, category: categoryId })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const transaction: Omit<Transaction, "id"> = {
        description: formData.description,
        amount:
          formData.type === "expense"
            ? -Math.abs(parseFloat(formData.amount))
            : Math.abs(parseFloat(formData.amount)),
        type: formData.type,
        category: formData.category,
        accountId: formData.accountId,
        toAccountId:
          formData.type === "transfer" ? formData.toAccountId : undefined,
        date: formData.date,
        completed: false,
        isRecurring: formData.isRecurring,
        recurringType: formData.isRecurring
          ? formData.recurringType
          : undefined,
        recurringEndDate: formData.isRecurring
          ? formData.recurringEndDate
          : undefined,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
      };

      await onSubmit(transaction);
    } catch (error) {
      console.error("Error submitting transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4 text-primary">
        {editTransaction ? "Transactie Bewerken" : "Nieuwe Transactie"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type & Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Type</label>
            <Select
              name="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "income" | "expense" | "transfer",
                  category: "",
                })
              }
              required
            >
              <option value="expense">Uitgave</option>
              <option value="income">Inkomst</option>
              <option value="transfer">Overboeking</option>
            </Select>
          </div>

          <div>
            <label className="label-text">Bedrag (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="input input-bordered w-full"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label-text">Beschrijving</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="input input-bordered w-full"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="label-text">Categorie</label>
          <div className="flex gap-2">
            <div ref={dropdownRef} className="dropdown w-full">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-outline w-full justify-between"
              >
                {formData.category ? (
                  <div className="flex items-center gap-2">
                    <div
                      className={`status ${getCategoryStatusClass(
                        categories.find((c) => c.id === formData.category)
                          ?.color || ""
                      )}`}
                    ></div>
                    {categories.find((c) => c.id === formData.category)?.name}
                  </div>
                ) : (
                  "Selecteer categorie"
                )}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[9999] w-full p-2 shadow max-h-60 overflow-y-auto"
              >
                <li>
                  <a
                    onClick={() => {
                      setFormData({ ...formData, category: "" });
                      // Close dropdown by removing focus
                      if (dropdownRef.current) {
                        const allFocusableElements =
                          dropdownRef.current.querySelectorAll("[tabindex]");
                        allFocusableElements.forEach((el) =>
                          (el as HTMLElement).blur()
                        );
                      }
                    }}
                  >
                    Selecteer categorie
                  </a>
                </li>
                {filteredCategories.map((cat) => (
                  <li key={cat.id}>
                    <a
                      onClick={() => {
                        setFormData({ ...formData, category: cat.id });
                        // Close dropdown by removing focus
                        if (dropdownRef.current) {
                          const allFocusableElements =
                            dropdownRef.current.querySelectorAll("[tabindex]");
                          allFocusableElements.forEach((el) =>
                            (el as HTMLElement).blur()
                          );
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`status ${getCategoryStatusClass(
                            cat.color
                          )}`}
                        ></div>
                        {cat.name}
                      </div>
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      // Close dropdown by removing focus and triggering a click outside
                      if (dropdownRef.current) {
                        const allFocusableElements =
                          dropdownRef.current.querySelectorAll("[tabindex]");
                        allFocusableElements.forEach((el) =>
                          (el as HTMLElement).blur()
                        );
                      }
                      // Use setTimeout to ensure dropdown closes before opening modal
                      setTimeout(() => {
                        categoryCreation.setIsCreating(true);
                      }, 100);
                    }}
                  >
                    + Nieuwe Categorie
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Category Creation Modal */}
        {categoryCreation.isCreating && (
          <div className="card bg-base-200 p-4">
            <input
              type="text"
              value={categoryCreation.newName}
              onChange={(e) => categoryCreation.setNewName(e.target.value)}
              className="input input-bordered mb-2"
              placeholder="Categorie naam"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={categoryCreation.handleCreate}
                className="btn btn-primary btn-sm"
              >
                Aanmaken
              </button>
              <button
                type="button"
                onClick={() => categoryCreation.setIsCreating(false)}
                className="btn btn-ghost btn-sm"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* Account & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">
              {formData.type === "transfer" ? "Van Rekening" : "Rekening"}
            </label>
            <Select
              name="accountId"
              value={formData.accountId}
              onChange={(e) =>
                setFormData({ ...formData, accountId: e.target.value })
              }
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </Select>
          </div>

          {formData.type === "transfer" && (
            <div>
              <label className="label-text">Naar Rekening</label>
              <Select
                name="toAccountId"
                value={formData.toAccountId}
                onChange={(e) =>
                  setFormData({ ...formData, toAccountId: e.target.value })
                }
                required
              >
                <option value="">Selecteer rekening</option>
                {accounts
                  .filter((acc) => acc.id !== formData.accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </Select>
            </div>
          )}

          <div>
            <label className="label-text">Datum</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="input input-bordered w-full"
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost flex-1"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary flex-1"
          >
            {isSubmitting ? "Bezig..." : "Opslaan"}
          </button>
        </div>
      </form>
    </div>
  );
}
