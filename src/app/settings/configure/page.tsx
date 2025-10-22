"use client";

import { useState, useEffect } from "react";
import SettingsLayout from "@/components/SettingsLayout";
import type {
  IncomeSource,
  RecurringExpense,
  Frequency,
} from "@/types/financial-config";

export default function ConfigurePage() {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpense[]
  >([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(
    null
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incomeRes, expensesRes] = await Promise.all([
        fetch("/api/config/income"),
        fetch("/api/config/expenses"),
      ]);

      const income = await incomeRes.json();
      const expenses = await expensesRes.json();

      setIncomeSources(income);
      setRecurringExpenses(expenses);
    } catch (error) {
      console.error("Failed to load configuration:", error);
    }
  };

  const totalMonthlyIncome = incomeSources
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + s.amount, 0);

  const totalMonthlyExpenses = recurringExpenses
    .filter((e) => e.isActive)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-success text-success-content">
            <div className="card-body">
              <h2 className="card-title text-sm">Maandelijks Inkomen</h2>
              <p className="text-3xl font-bold">
                €{totalMonthlyIncome.toFixed(2)}
              </p>
              <p className="text-xs opacity-80">
                {incomeSources.filter((s) => s.isActive).length} bronnen
              </p>
            </div>
          </div>

          <div className="card bg-error text-error-content">
            <div className="card-body">
              <h2 className="card-title text-sm">Maandelijkse Uitgaven</h2>
              <p className="text-3xl font-bold">
                €{totalMonthlyExpenses.toFixed(2)}
              </p>
              <p className="text-xs opacity-80">
                {recurringExpenses.filter((e) => e.isActive).length} uitgaven
              </p>
            </div>
          </div>

          <div
            className={`card ${
              totalMonthlyIncome - totalMonthlyExpenses >= 0
                ? "bg-info"
                : "bg-warning"
            } text-base-content`}
          >
            <div className="card-body">
              <h2 className="card-title text-sm">Netto per Maand</h2>
              <p className="text-3xl font-bold">
                €{(totalMonthlyIncome - totalMonthlyExpenses).toFixed(2)}
              </p>
              <p className="text-xs opacity-80">
                {totalMonthlyIncome - totalMonthlyExpenses >= 0
                  ? "✅ Positief"
                  : "⚠️ Negatief"}
              </p>
            </div>
          </div>
        </div>

        {/* Income Sources Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">💵 Inkomstenbronnen</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingIncome(null);
                  setShowIncomeForm(true);
                }}
              >
                + Toevoegen
              </button>
            </div>

            {showIncomeForm && (
              <IncomeForm
                income={editingIncome}
                onSave={async (data) => {
                  if (editingIncome) {
                    await fetch("/api/config/income", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: editingIncome.id, ...data }),
                    });
                  } else {
                    await fetch("/api/config/income", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(data),
                    });
                  }
                  setShowIncomeForm(false);
                  setEditingIncome(null);
                  loadData();
                }}
                onCancel={() => {
                  setShowIncomeForm(false);
                  setEditingIncome(null);
                }}
              />
            )}

            <div className="space-y-2">
              {incomeSources.length === 0 ? (
                <p className="text-center py-8 text-base-content/50">
                  Nog geen inkomstenbronnen geconfigureerd. Klik op "Toevoegen"
                  om te beginnen.
                </p>
              ) : (
                incomeSources.map((source) => (
                  <div
                    key={source.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      source.isActive
                        ? "bg-base-200"
                        : "bg-base-200/50 opacity-60"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{source.name}</h3>
                        {!source.isActive && (
                          <span className="badge badge-sm">Inactief</span>
                        )}
                      </div>
                      <p className="text-sm text-base-content/70">
                        €{source.amount.toFixed(2)}/
                        {source.frequency === "monthly"
                          ? "maand"
                          : source.frequency}
                        {source.dayOfMonth && ` • Dag ${source.dayOfMonth}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          setEditingIncome(source);
                          setShowIncomeForm(true);
                        }}
                      >
                        Bewerken
                      </button>
                      <button
                        className="btn btn-sm btn-ghost btn-error"
                        onClick={async () => {
                          if (
                            confirm(
                              `Weet je zeker dat je "${source.name}" wilt verwijderen?`
                            )
                          ) {
                            await fetch(`/api/config/income?id=${source.id}`, {
                              method: "DELETE",
                            });
                            loadData();
                          }
                        }}
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recurring Expenses Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">💸 Terugkerende Uitgaven</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingExpense(null);
                  setShowExpenseForm(true);
                }}
              >
                + Toevoegen
              </button>
            </div>

            {showExpenseForm && (
              <ExpenseForm
                expense={editingExpense}
                onSave={async (data) => {
                  if (editingExpense) {
                    await fetch("/api/config/expenses", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: editingExpense.id, ...data }),
                    });
                  } else {
                    await fetch("/api/config/expenses", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(data),
                    });
                  }
                  setShowExpenseForm(false);
                  setEditingExpense(null);
                  loadData();
                }}
                onCancel={() => {
                  setShowExpenseForm(false);
                  setEditingExpense(null);
                }}
              />
            )}

            <div className="space-y-2">
              {recurringExpenses.length === 0 ? (
                <p className="text-center py-8 text-base-content/50">
                  Nog geen terugkerende uitgaven geconfigureerd. Klik op
                  "Toevoegen" om te beginnen.
                </p>
              ) : (
                recurringExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      expense.isActive
                        ? "bg-base-200"
                        : "bg-base-200/50 opacity-60"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{expense.name}</h3>
                        {expense.isEssential && (
                          <span className="badge badge-sm badge-error">
                            Essentieel
                          </span>
                        )}
                        {expense.isVariable && (
                          <span className="badge badge-sm badge-warning">
                            Variabel
                          </span>
                        )}
                        {!expense.isActive && (
                          <span className="badge badge-sm">Inactief</span>
                        )}
                      </div>
                      <p className="text-sm text-base-content/70">
                        €{expense.amount.toFixed(2)}/
                        {expense.frequency === "monthly"
                          ? "maand"
                          : expense.frequency}
                        {expense.category && ` • ${expense.category}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          setEditingExpense(expense);
                          setShowExpenseForm(true);
                        }}
                      >
                        Bewerken
                      </button>
                      <button
                        className="btn btn-sm btn-ghost btn-error"
                        onClick={async () => {
                          if (
                            confirm(
                              `Weet je zeker dat je "${expense.name}" wilt verwijderen?`
                            )
                          ) {
                            await fetch(
                              `/api/config/expenses?id=${expense.id}`,
                              {
                                method: "DELETE",
                              }
                            );
                            loadData();
                          }
                        }}
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}

// Income Form Component (same as before, truncated for brevity - includes all form fields)
function IncomeForm({
  income,
  onSave,
  onCancel,
}: {
  income: IncomeSource | null;
  onSave: (data: Omit<IncomeSource, "id">) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Omit<IncomeSource, "id">>({
    name: income?.name || "",
    amount: income?.amount || 0,
    frequency: income?.frequency || "monthly",
    dayOfMonth: income?.dayOfMonth,
    startDate: income?.startDate || new Date().toISOString().split("T")[0],
    endDate: income?.endDate,
    isActive: income?.isActive ?? true,
    category: income?.category || "salary",
    notes: income?.notes,
  });

  return (
    <div className="card bg-base-300 p-4 mb-4">
      <h3 className="font-bold mb-4">
        {income ? "Bewerk" : "Nieuwe"} Inkomstenbron
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Naam</span>
          </label>
          <input
            type="text"
            placeholder="Bijv. Salaris - Bedrijfsnaam"
            className="input input-bordered"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Bedrag (€)</span>
          </label>
          <input
            type="number"
            step="0.01"
            className="input input-bordered"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Frequentie</span>
          </label>
          <select
            className="select select-bordered"
            value={formData.frequency}
            onChange={(e) =>
              setFormData({
                ...formData,
                frequency: e.target.value as Frequency,
              })
            }
          >
            <option value="weekly">Wekelijks</option>
            <option value="biweekly">Tweewekelijks</option>
            <option value="monthly">Maandelijks</option>
            <option value="quarterly">Kwartaal</option>
            <option value="yearly">Jaarlijks</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Dag van de maand (optioneel)</span>
          </label>
          <input
            type="number"
            min="1"
            max="31"
            className="input input-bordered"
            value={formData.dayOfMonth || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                dayOfMonth: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Startdatum</span>
          </label>
          <input
            type="date"
            className="input input-bordered"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Einddatum (optioneel)</span>
          </label>
          <input
            type="date"
            className="input input-bordered"
            value={formData.endDate || ""}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value || undefined })
            }
          />
        </div>

        <div className="form-control md:col-span-2">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            <span className="label-text">Actief</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="btn btn-primary" onClick={() => onSave(formData)}>
          Opslaan
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>
          Annuleren
        </button>
      </div>
    </div>
  );
}

// Expense Form Component (same structure as IncomeForm)
function ExpenseForm({
  expense,
  onSave,
  onCancel,
}: {
  expense: RecurringExpense | null;
  onSave: (data: Omit<RecurringExpense, "id">) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Omit<RecurringExpense, "id">>({
    name: expense?.name || "",
    category: expense?.category || "uncategorized",
    amount: expense?.amount || 0,
    frequency: expense?.frequency || "monthly",
    dayOfMonth: expense?.dayOfMonth,
    startDate: expense?.startDate || new Date().toISOString().split("T")[0],
    endDate: expense?.endDate,
    isActive: expense?.isActive ?? true,
    isEssential: expense?.isEssential ?? false,
    isVariable: expense?.isVariable ?? false,
    estimatedVariance: expense?.estimatedVariance,
    notes: expense?.notes,
  });

  return (
    <div className="card bg-base-300 p-4 mb-4">
      <h3 className="font-bold mb-4">
        {expense ? "Bewerk" : "Nieuwe"} Uitgave
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Naam</span>
          </label>
          <input
            type="text"
            placeholder="Bijv. Huur - Patrimonium"
            className="input input-bordered"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Categorie</span>
          </label>
          <input
            type="text"
            placeholder="Bijv. rent, groceries, utilities"
            className="input input-bordered"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Bedrag (€)</span>
          </label>
          <input
            type="number"
            step="0.01"
            className="input input-bordered"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Frequentie</span>
          </label>
          <select
            className="select select-bordered"
            value={formData.frequency}
            onChange={(e) =>
              setFormData({
                ...formData,
                frequency: e.target.value as Frequency,
              })
            }
          >
            <option value="weekly">Wekelijks</option>
            <option value="biweekly">Tweewekelijks</option>
            <option value="monthly">Maandelijks</option>
            <option value="quarterly">Kwartaal</option>
            <option value="yearly">Jaarlijks</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Dag van de maand (optioneel)</span>
          </label>
          <input
            type="number"
            min="1"
            max="31"
            className="input input-bordered"
            value={formData.dayOfMonth || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                dayOfMonth: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Startdatum</span>
          </label>
          <input
            type="date"
            className="input input-bordered"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
          />
        </div>

        <div className="form-control md:col-span-2">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            <span className="label-text">Actief</span>
          </label>
        </div>

        <div className="form-control md:col-span-2">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-error"
              checked={formData.isEssential}
              onChange={(e) =>
                setFormData({ ...formData, isEssential: e.target.checked })
              }
            />
            <span className="label-text">
              Essentieel (kan niet verminderen)
            </span>
          </label>
        </div>

        <div className="form-control md:col-span-2">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-warning"
              checked={formData.isVariable}
              onChange={(e) =>
                setFormData({ ...formData, isVariable: e.target.checked })
              }
            />
            <span className="label-text">Variabel bedrag</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="btn btn-primary" onClick={() => onSave(formData)}>
          Opslaan
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>
          Annuleren
        </button>
      </div>
    </div>
  );
}
