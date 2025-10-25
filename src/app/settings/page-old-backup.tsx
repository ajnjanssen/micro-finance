"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/ui/foundation/Header";
import Card from "@/ui/foundation/Card";
import { Account, Transaction, Category } from "@/types/finance";
import type {
  IncomeSource,
  RecurringExpense,
  Frequency,
} from "@/types/financial-config";
import { convertToMonthly } from "@/types/financial-config";

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "accounts" | "transactions" | "categories" | "configuration" | "logs"
  >("accounts");

  useEffect(() => {
    // Set initial tab from URL parameter
    if (tabParam === "configure") {
      setActiveTab("configuration");
    }
  }, [tabParam]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
      setLastUpdated(accountsData.lastUpdated || new Date().toISOString());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/settings/export");
      const data = await response.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `micro-finance-settings-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch("/api/settings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        loadData(); // Refresh data
        alert("Settings imported successfully!");
      } else {
        alert("Import failed!");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Invalid JSON file!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <Header level={1}>Settings</Header>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-base-300 rounded"></div>
            <div className="h-64 bg-base-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-base-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-primary hover:text-primary-focus">
                ← Terug naar Dashboard
              </a>
              <div className="border-l border-base-300 h-6"></div>
              <h1 className="text-2xl font-bold text-base-content">
                Instellingen
              </h1>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} className="btn btn-outline btn-sm">
                📤 Export
              </button>
              <label className="btn btn-outline btn-sm">
                📥 Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Collapsible Sidebar Menu */}
          <aside className="col-span-12 md:col-span-3">
            <nav className="card bg-base-100 shadow-sm fixed w-fit">
              <ul className="menu w-full">
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
                          className={activeTab === "accounts" ? "active" : ""}
                          onClick={() => setActiveTab("accounts")}
                        >
                          🏦 Rekeningen ({accounts.length})
                        </a>
                      </li>
                      <li>
                        <a
                          className={
                            activeTab === "transactions" ? "active" : ""
                          }
                          onClick={() => setActiveTab("transactions")}
                        >
                          💰 Transacties ({transactions.length})
                        </a>
                      </li>
                      <li>
                        <a
                          className={activeTab === "categories" ? "active" : ""}
                          onClick={() => setActiveTab("categories")}
                        >
                          🏷️ Categorieën ({categories.length})
                        </a>
                      </li>
                      <li>
                        <a
                          className={activeTab === "logs" ? "active" : ""}
                          onClick={() => setActiveTab("logs")}
                        >
                          📋 Activity Log
                        </a>
                      </li>
                    </ul>
                  </details>
                </li>

                {/* Configuration Section */}
                <li>
                  <details>
                    <summary className="group">
                      <span className="text-lg">⚙️</span>
                      Configuratie
                    </summary>
                    <ul>
                      <li>
                        <a
                          className={
                            activeTab === "configuration" ? "active" : ""
                          }
                          onClick={() => setActiveTab("configuration")}
                        >
                          💰 Inkomsten & Uitgaven
                        </a>
                      </li>
                    </ul>
                  </details>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Content Area */}
          <main className="col-span-12 md:col-span-9">
            {activeTab === "accounts" && (
              <AccountsTab accounts={accounts} onUpdate={loadData} />
            )}
            {activeTab === "transactions" && (
              <TransactionsTab
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                onUpdate={loadData}
              />
            )}
            {activeTab === "categories" && (
              <CategoriesTab categories={categories} onUpdate={loadData} />
            )}
            {activeTab === "configuration" && <ConfigurationTab />}
            {activeTab === "logs" && <LogsTab lastUpdated={lastUpdated} />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}

// Placeholder components - we'll implement these next
function AccountsTab({
  accounts,
  onUpdate,
}: {
  accounts: Account[];
  onUpdate: () => void;
}) {
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (account: Omit<Account, "id">) => {
    try {
      const response = await fetch("/api/settings/accounts", {
        method: "POST",
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
  const handleResetOnboarding = () => {
    if (
      confirm(
        "Wil je de onboarding wizard opnieuw doorlopen? Dit verwijdert NIET je bestaande data."
      )
    ) {
      localStorage.removeItem("onboarding_completed");
      alert(
        "Onboarding is gereset! Herlaad de homepage om de wizard opnieuw te starten."
      );
    }
  };

  const handleFullReset = async () => {
    if (
      !confirm(
        "⚠️ Dit verwijdert ALLE data (accounts, transacties, configuratie) en herstart de onboarding wizard. Dit kan niet ongedaan worden gemaakt! Weet je het zeker?"
      )
    ) {
      return;
    }

    try {
      // Clear all data
      await fetch("/api/clear-data", { method: "POST" });

      // Clear accounts by writing empty data
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reset-all",
        }),
      });

      // Reset onboarding flag
      localStorage.removeItem("onboarding_completed");

      alert("✅ Reset voltooid! Je wordt doorgestuurd naar de onboarding...");

      // Redirect to home page after short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      alert("❌ Fout bij resetten. Probeer het opnieuw.");
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="divider"></div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Onboarding</h3>
        <div className="card bg-base-100 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold mb-2">Setup Wizard</h4>
              <p className="text-sm text-base-content/70 mb-4">
                Wil je de initiele setup wizard opnieuw doorlopen? Dit is handig
                als je opnieuw wilt beginnen of hulp nodig hebt bij de
                configuratie.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetOnboarding}
            className="btn btn-outline btn-sm"
          >
            🔄 Reset Onboarding
          </button>
        </div>
      </div>

      <div className="divider"></div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-error">
          ⚠️ Danger Zone
        </h3>
        <div className="card bg-error/10 border border-error/30 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold mb-2">Complete Reset</h4>
              <p className="text-sm text-base-content/70 mb-4">
                Verwijder ALLE data en start helemaal opnieuw. Dit verwijdert je
                accounts, transacties, configuratie en alle instellingen. Deze
                actie kan niet ongedaan worden gemaakt!
              </p>
            </div>
          </div>
          <button onClick={handleFullReset} className="btn btn-error btn-sm">
            🗑️ Reset Alles & Herstart Onboarding
          </button>
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

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch("/api/settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          type: formData.type,
          color: newCategoryColor,
        }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setFormData({ ...formData, category: newCategory.id });
        setIsCreatingCategory(false);
        setNewCategoryName("");
        setNewCategoryColor("#3b82f6");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

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
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setIsCreatingCategory(true);
                  } else {
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="select select-bordered w-full"
                required={!isCreatingCategory}
              >
                <option value="">Select Category</option>
                {categories
                  .filter((cat) => cat.type === formData.type)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                <option value="__new__">+ Add New Category</option>
              </select>

              {isCreatingCategory && (
                <div className="mt-3 p-3 border border-base-300 rounded-lg bg-base-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-sm">New Category</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setNewCategoryName("");
                      }}
                      className="btn btn-xs btn-ghost"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="label-text text-xs">Name</label>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="input input-bordered input-sm w-full"
                        placeholder="e.g. Savings, Vacation..."
                      />
                    </div>
                    <div>
                      <label className="label-text text-xs">Color</label>
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="input input-bordered input-sm w-full h-8"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="btn btn-primary btn-sm w-full"
                      disabled={!newCategoryName.trim()}
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              )}
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

// Configuration Tab Component
function ConfigurationTab() {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpense[]
  >([]);
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
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
      const [incomeRes, expensesRes, financeRes] = await Promise.all([
        fetch("/api/config/income"),
        fetch("/api/config/expenses"),
        fetch("/api/finance"),
      ]);

      const income = await incomeRes.json();
      const expenses = await expensesRes.json();
      const financeData = await financeRes.json();

      setIncomeSources(income);
      setRecurringExpenses(expenses);
      setRecurringTransactions(
        (financeData.transactions || []).filter((t: any) => t.isRecurring)
      );
    } catch (error) {
      console.error("Failed to load configuration:", error);
    }
  };

  const totalMonthlyIncome =
    incomeSources
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + convertToMonthly(s.amount, s.frequency), 0) +
    recurringTransactions
      .filter((t: any) => t.type === "income")
      .reduce((sum, t: any) => sum + Math.abs(t.amount), 0);

  const totalMonthlyExpenses =
    recurringExpenses
      .filter((e) => e.isActive)
      .reduce((sum, e) => sum + convertToMonthly(e.amount, e.frequency), 0) +
    recurringTransactions
      .filter((t: any) => t.type === "expense")
      .reduce((sum, t: any) => sum + Math.abs(t.amount), 0);

  return (
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
                Nog geen inkomstenbronnen geconfigureerd. Klik op "Toevoegen" om
                te beginnen.
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
            {recurringExpenses.length === 0 &&
            recurringTransactions.filter((t: any) => t.type === "expense")
              .length === 0 ? (
              <p className="text-center py-8 text-base-content/50">
                Nog geen terugkerende uitgaven geconfigureerd. Klik op
                "Toevoegen" om te beginnen.
              </p>
            ) : (
              <>
                {recurringExpenses.map((expense) => (
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
                ))}

                {/* Recurring Transactions from Transactions Tab */}
                {recurringTransactions
                  .filter((t: any) => t.type === "expense")
                  .map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-info/10 border border-info/30"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {transaction.description}
                          </h3>
                          <span className="badge badge-sm badge-info">
                            Van Transacties
                          </span>
                          <span className="badge badge-sm">
                            {transaction.recurringType === "monthly"
                              ? "Maandelijks"
                              : transaction.recurringType}
                          </span>
                        </div>
                        <p className="text-sm text-base-content/70">
                          €{Math.abs(transaction.amount).toFixed(2)}/maand
                          {transaction.category && ` • ${transaction.category}`}
                        </p>
                      </div>
                      <div className="text-xs text-base-content/50">
                        Beheer via Transacties tab
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Income Form Component
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
    budgetType: expense?.budgetType,
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

        <div className="form-control md:col-span-2">
          <label className="label">
            <span className="label-text">Budget Type (50/30/20 Regel)</span>
          </label>
          <select
            className="select select-bordered"
            value={formData.budgetType || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                budgetType: (e.target.value || undefined) as
                  | "needs"
                  | "wants"
                  | "savings"
                  | undefined,
              })
            }
          >
            <option value="">❓ Niet ingesteld</option>
            <option value="needs">🏠 Needs (50% - Essentiële uitgaven)</option>
            <option value="wants">🎉 Wants (30% - Levensstijl)</option>
            <option value="savings">💰 Savings (20% - Sparen)</option>
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
