"use client";

import { useState } from "react";
import { Transaction, Account, Category } from "@/types/finance";

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  accountBalances: { [accountId: string]: number };
  onSubmit: (transaction: Omit<Transaction, "id">) => Promise<void>;
  onCancel: () => void;
  editTransaction?: Transaction;
}

export default function TransactionForm({
  accounts,
  categories,
  accountBalances,
  onSubmit,
  onCancel,
  editTransaction,
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    description: editTransaction?.description || "",
    amount: editTransaction ? Math.abs(editTransaction.amount).toString() : "",
    type: editTransaction?.type || ("expense" as "income" | "expense"),
    category: editTransaction?.category || "",
    accountId: editTransaction?.accountId || accounts[0]?.id || "",
    date: editTransaction?.date || new Date().toISOString().split("T")[0],
    isRecurring: editTransaction?.isRecurring || false,
    recurringType:
      editTransaction?.recurringType ||
      ("monthly" as "monthly" | "yearly" | "weekly" | "daily"),
    recurringEndDate: editTransaction?.recurringEndDate || "",
    tags: editTransaction?.tags ? editTransaction.tags.join(", ") : "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      const finalAmount =
        formData.type === "expense" ? -Math.abs(amount) : Math.abs(amount);

      const transaction: Omit<Transaction, "id"> = {
        description: formData.description,
        amount: finalAmount,
        type: formData.type,
        category: formData.category,
        accountId: formData.accountId,
        date: formData.date,
        isRecurring: formData.isRecurring,
        recurringType: formData.isRecurring
          ? formData.recurringType
          : undefined,
        recurringEndDate:
          formData.isRecurring && formData.recurringEndDate
            ? formData.recurringEndDate
            : undefined,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
      };

      await onSubmit(transaction);

      // Reset form
      setFormData({
        description: "",
        amount: "",
        type: "expense",
        category: "",
        accountId: "",
        date: new Date().toISOString().split("T")[0],
        isRecurring: false,
        recurringType: "monthly",
        recurringEndDate: "",
        tags: "",
      });
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "income" | "expense",
                  category: "",
                })
              }
              className="select select-bordered w-full"
              required
            >
              <option value="expense">Uitgave</option>
              <option value="income">Inkomst</option>
            </select>
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
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label className="label-text">Beschrijving</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="input input-bordered w-full"
            placeholder="Bijvoorbeeld: Boodschappen, Salaris, etc."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Categorie</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="select select-bordered w-full"
              required
            >
              <option value="">Selecteer categorie</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-text">Datum</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData({ ...formData, isRecurring: e.target.checked })
              }
              className="checkbox checkbox-primary"
            />
            <label
              htmlFor="isRecurring"
              className="ml-2 block text-sm text-base-content"
            >
              Terugkerende transactie
            </label>
          </div>

          {formData.isRecurring && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div>
                <label className="label-text">Frequentie</label>
                <select
                  value={formData.recurringType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurringType: e.target.value as any,
                    })
                  }
                  className="select select-bordered w-full"
                >
                  <option value="monthly">Maandelijks</option>
                  <option value="yearly">Jaarlijks</option>
                  <option value="weekly">Wekelijks</option>
                  <option value="daily">Dagelijks</option>
                </select>
              </div>

              <div>
                <label className="label-text">Einddatum (optioneel)</label>
                <input
                  type="date"
                  value={formData.recurringEndDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurringEndDate: e.target.value,
                    })
                  }
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="label-text">
            Tags (optioneel, gescheiden door komma's)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="input input-bordered w-full"
            placeholder="bijvoorbeeld: vakantie, werk, auto"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting
              ? editTransaction
                ? "Bijwerken..."
                : "Toevoegen..."
              : editTransaction
              ? "Transactie Bijwerken"
              : "Transactie Toevoegen"}
          </button>
        </div>
      </form>
    </div>
  );
}
