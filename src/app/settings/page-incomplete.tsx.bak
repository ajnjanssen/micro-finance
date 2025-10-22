"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  IncomeSource,
  RecurringExpense,
  Frequency,
} from "@/types/financial-config";
import { Account, Transaction, Category } from "@/types/finance";

type SettingsView = 
  | "configure-income" 
  | "configure-expenses" 
  | "data-accounts" 
  | "data-transactions" 
  | "data-categories" 
  | "data-logs"
  | "general";

export default function SettingsPage() {
  const [activeView, setActiveView] = useState<SettingsView>("configure-income");
  
  // Configuration state (financial-config.json)
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  
  // Data management state (financial-data.json)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    loadConfiguration();
    loadDataManagement();
  }, []);
  
  const loadDataManagement = async () => {
    try {
      const [accountsRes, transactionsRes, categoriesRes] = await Promise.all([
        fetch("/api/settings/accounts"),
        fetch("/api/settings/transactions"),
        fetch("/api/settings/categories"),
      ]);

      const [accountsData, transactionsData, categoriesData] =
        await Promise.all([
          accountsRes.json(),
          transactionsRes.json(),
          categoriesRes.json(),
        ]);

      setAccounts(accountsData);
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadConfiguration = async () => {
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
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-base-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary hover:text-primary-focus">
              ← Terug naar Dashboard
            </Link>
            <div className="border-l border-base-300 h-6"></div>
            <h1 className="text-2xl font-bold text-base-content">Instellingen</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Collapsible Sidebar Menu */}
          <aside className="col-span-12 md:col-span-3">
            <nav className="card bg-base-100 shadow-sm">
              <ul className="menu w-full">
                {/* Configuration Section */}
                <li>
                  <details open>
                    <summary className="group">
                      <span className="text-lg">💰</span>
                      Financiële Configuratie
                    </summary>
                    <ul>
                      <li>
                        <a
                          className={activeView === "configure-income" ? "active" : ""}
                          onClick={() => setActiveView("configure-income")}
                        >
                          💵 Inkomstenbronnen
                        </a>
                      </li>
                      <li>
                        <a
                          className={activeView === "configure-expenses" ? "active" : ""}
                          onClick={() => setActiveView("configure-expenses")}
                        >
                          💸 Terugkerende Uitgaven
                        </a>
                      </li>
                    </ul>
                  </details>
                </li>

                {/* Data Management Section */}
                <li>
                  <details open>
                    <summary className="group">
                      <span className="text-lg">📊</span>
                      Gegevensbeheer
                    </summary>
                    <ul>
                      <li>
                        <a
                          className={activeView === "data-accounts" ? "active" : ""}
                          onClick={() => setActiveView("data-accounts")}
                        >
                          🏦 Rekeningen
                        </a>
                      </li>
                      <li>
                        <a
                          className={activeView === "data-transactions" ? "active" : ""}
                          onClick={() => setActiveView("data-transactions")}
                        >
                          💰 Transacties
                        </a>
                      </li>
                      <li>
                        <a
                          className={activeView === "data-categories" ? "active" : ""}
                          onClick={() => setActiveView("data-categories")}
                        >
                          🏷️ Categorieën
                        </a>
                      </li>
                      <li>
                        <a
                          className={activeView === "data-logs" ? "active" : ""}
                          onClick={() => setActiveView("data-logs")}
                        >
                          📋 Activity Log
                        </a>
                      </li>
                    </ul>
                  </details>
                </li>

                {/* General Settings */}
                <li>
                  <a
                    className={activeView === "general" ? "active" : ""}
                    onClick={() => setActiveView("general")}
                  >
                    <span className="text-lg">⚙️</span>
                    Algemene Instellingen
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Content Area */}
          <main className="col-span-12 md:col-span-9">
            {/* Income Sources View */}
            {activeView === "configure-income" && (
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

                {/* Income Sources List */}
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
                          loadConfiguration();
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
                                    loadConfiguration();
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
            )}

            {/* Expenses View */}
            {activeView === "configure-expenses" && (
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
                        loadConfiguration();
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
                                  loadConfiguration();
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
            )}

            {/* Data Management Views */}
            {activeView === "data-accounts" && (
              <AccountsTab accounts={accounts} onUpdate={loadDataManagement} />
            )}

            {activeView === "data-transactions" && (
              <TransactionsTab
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                onUpdate={loadDataManagement}
              />
            )}

            {activeView === "data-categories" && (
              <CategoriesTab categories={categories} onUpdate={loadDataManagement} />
            )}

            {activeView === "data-logs" && <LogsTab lastUpdated={lastUpdated} />}

            {activeView === "general" && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">⚙️ Algemene Instellingen</h2>
                  <p>General settings coming soon...</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// Income Form Component (keeping it short for this file)
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

// Expense Form Component
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account),
      });

      if (response.ok) {
        onUpdate();
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Create account error:", error);
    }
  };

  const handleUpdate = async (account: Account) => {
    try {
      const response = await fetch(`/api/settings/accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account),
      });

      if (response.ok) {
        onUpdate();
        setEditingAccount(null);
      }
    } catch (error) {
      console.error("Update account error:", error);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      const response = await fetch(`/api/settings/accounts/${accountId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Delete account error:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Accounts Management</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary btn-sm"
        >
          Add Account
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>{account.name}</td>
                <td>
                  <span
                    className={`badge ${
                      account.type === "checking"
                        ? "badge-primary"
                        : "badge-secondary"
                    }`}
                  >
                    {account.type}
                  </span>
                </td>
                <td>{account.description}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingAccount(account)}
                      className="btn btn-xs btn-outline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="btn btn-xs btn-error"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(isCreating || editingAccount) && (
        <AccountForm
          account={editingAccount}
          onSave={isCreating ? handleCreate : handleUpdate}
          onCancel={() => {
            setIsCreating(false);
            setEditingAccount(null);
          }}
        />
      )}
    </div>
  );
}

function TransactionsTab({
  transactions,
  categories,
  accounts,
  onUpdate,
}: {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onUpdate: () => void;
}) {
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (transaction: Omit<Transaction, "id">) => {
    try {
      const response = await fetch("/api/settings/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });

      if (response.ok) {
        onUpdate();
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Create transaction error:", error);
    }
  };

  const handleUpdate = async (transaction: Transaction) => {
    try {
      const response = await fetch(
        `/api/settings/transactions/${transaction.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaction),
        }
      );

      if (response.ok) {
        onUpdate();
        setEditingTransaction(null);
      }
    } catch (error) {
      console.error("Update transaction error:", error);
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const response = await fetch(
        `/api/settings/transactions/${transactionId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Delete transaction error:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transactions Management</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary btn-sm"
        >
          Add Transaction
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 50).map((transaction) => (
              <tr key={transaction.id}>
                <td>{new Date(transaction.date).toLocaleDateString()}</td>
                <td className="max-w-xs truncate">{transaction.description}</td>
                <td
                  className={
                    transaction.type === "income"
                      ? "text-success"
                      : "text-error"
                  }
                >
                  {transaction.type === "income" ? "+" : ""}
                  {formatCurrency(transaction.amount)}
                </td>
                <td>
                  <span
                    className={`badge ${
                      transaction.type === "income"
                        ? "badge-success"
                        : "badge-error"
                    }`}
                  >
                    {transaction.type}
                  </span>
                </td>
                <td>{transaction.category}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="btn btn-xs btn-outline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="btn btn-xs btn-error"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length > 50 && (
          <p className="text-sm text-base-content/70 mt-2">
            Showing first 50 transactions. Use filters for more specific
            results.
          </p>
        )}
      </div>

      {(isCreating || editingTransaction) && (
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          accounts={accounts}
          onSave={isCreating ? handleCreate : handleUpdate}
          onCancel={() => {
            setIsCreating(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
}

function CategoriesTab({
  categories,
  onUpdate,
}: {
  categories: Category[];
  onUpdate: () => void;
}) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (category: Omit<Category, "id">) => {
    try {
      const response = await fetch("/api/settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });

      if (response.ok) {
        onUpdate();
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Create category error:", error);
    }
  };

  const handleUpdate = async (category: Category) => {
    try {
      const response = await fetch(`/api/settings/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });

      if (response.ok) {
        onUpdate();
        setEditingCategory(null);
      }
    } catch (error) {
      console.error("Update category error:", error);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await fetch(`/api/settings/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Delete category error:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Categories Management</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary btn-sm"
        >
          Add Category
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Color</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>
                  <span
                    className={`badge ${
                      category.type === "income"
                        ? "badge-success"
                        : "badge-error"
                    }`}
                  >
                    {category.type}
                  </span>
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-mono text-xs">{category.color}</span>
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="btn btn-xs btn-outline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="btn btn-xs btn-error"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(isCreating || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          onSave={isCreating ? handleCreate : handleUpdate}
          onCancel={() => {
            setIsCreating(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

function LogsTab({ lastUpdated }: { lastUpdated: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center p-3 bg-base-100 rounded">
          <span>Last Updated:</span>
          <span className="font-mono text-sm">
            {new Date(lastUpdated).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// AccountForm component
function AccountForm({
  account,
  onSave,
  onCancel,
}: {
  account?: Account | null;
  onSave: (account: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: account?.name || "",
    type: account?.type || "checking",
    description: account?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (account) {
      onSave({ ...account, ...formData });
    } else {
      onSave({ ...formData, id: `account-${Date.now()}` });
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">
          {account ? "Edit Account" : "Create Account"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="label">
              <span className="label-text">Name</span>
            </label>
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
            <label className="label">
              <span className="label-text">Type</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as Account["type"],
                })
              }
              className="select select-bordered w-full"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="crypto">Crypto</option>
              <option value="stocks">Stocks</option>
              <option value="debt">Debt</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="textarea textarea-bordered w-full"
              rows={3}
            />
          </div>

          <div className="modal-action">
            <button type="button" onClick={onCancel} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {account ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// TransactionForm component
function TransactionForm({
  transaction,
  categories,
  accounts,
  onSave,
  onCancel,
}: {
  transaction?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  onSave: (transaction: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    description: transaction?.description || "",
    amount: transaction?.amount || 0,
    type: transaction?.type || "expense",
    category: transaction?.category || "",
    accountId: transaction?.accountId || "",
    date: transaction?.date || new Date().toISOString().split("T")[0],
    isRecurring: transaction?.isRecurring || false,
    recurringType: transaction?.recurringType || "monthly",
    tags: transaction?.tags?.join(", ") || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount.toString()),
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [],
    };

    if (transaction) {
      onSave({ ...transaction, ...transactionData });
    } else {
      onSave({ ...transactionData, id: `tx-manual-${Date.now()}` });
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg">
          {transaction ? "Edit Transaction" : "Create Transaction"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Description</span>
              </label>
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

            <div>
              <label className="label">
                <span className="label-text">Amount (€)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="input input-bordered w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Type</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "income" | "expense",
                  })
                }
                className="select select-bordered w-full"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="select select-bordered w-full"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Account</span>
              </label>
              <select
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                className="select select-bordered w-full"
                required
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Date</span>
              </label>
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

            <div>
              <label className="label">
                <span className="label-text">Recurring</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) =>
                    setFormData({ ...formData, isRecurring: e.target.checked })
                  }
                  className="checkbox"
                />
                <span className="label-text">Is Recurring</span>
              </div>
            </div>
          </div>

          {formData.isRecurring && (
            <div>
              <label className="label">
                <span className="label-text">Recurring Type</span>
              </label>
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
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
          )}

          <div>
            <label className="label">
              <span className="label-text">Tags (comma separated)</span>
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              className="input input-bordered w-full"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="modal-action">
            <button type="button" onClick={onCancel} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {transaction ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// CategoryForm component
function CategoryForm({
  category,
  onSave,
  onCancel,
}: {
  category?: Category | null;
  onSave: (category: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    type: category?.type || "expense",
    color: category?.color || "#3B82F6",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category) {
      onSave({ ...category, ...formData });
    } else {
      onSave({ ...formData, id: `cat-${Date.now()}` });
    }
  };

  const presetColors = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#EAB308",
    "#84CC16",
    "#22C55E",
    "#10B981",
    "#14B8A6",
    "#06B6D4",
    "#0EA5E9",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#A855F7",
    "#D946EF",
    "#EC4899",
    "#F43F5E",
    "#6B7280",
    "#374151",
    "#111827",
  ];

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">
          {category ? "Edit Category" : "Create Category"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="label">
              <span className="label-text">Name</span>
            </label>
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
            <label className="label">
              <span className="label-text">Type</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "income" | "expense",
                })
              }
              className="select select-bordered w-full"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Color</span>
            </label>
            <div className="space-y-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full h-10 rounded border"
              />
              <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className="w-8 h-8 rounded border-2 border-base-300 hover:border-base-content"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-action">
            <button type="button" onClick={onCancel} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {category ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
