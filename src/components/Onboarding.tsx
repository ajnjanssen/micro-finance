"use client";

import { useState } from "react";
import { Account } from "@/types/finance";
import type { IncomeSource, RecurringExpense } from "@/types/financial-config";

interface OnboardingProps {
  onComplete: () => void;
}

type OnboardingStep =
  | "welcome"
  | "accounts"
  | "income"
  | "expenses"
  | "complete";

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [accounts, setAccounts] = useState<Omit<Account, "id">[]>([]);
  const [incomeSources, setIncomeSources] = useState<
    Omit<IncomeSource, "id">[]
  >([]);
  const [expenses, setExpenses] = useState<Omit<RecurringExpense, "id">[]>([]);

  const handleAccountAdd = (account: Omit<Account, "id">) => {
    setAccounts([...accounts, account]);
  };

  const handleIncomeAdd = (income: Omit<IncomeSource, "id">) => {
    setIncomeSources([...incomeSources, income]);
  };

  const handleExpenseAdd = (expense: Omit<RecurringExpense, "id">) => {
    setExpenses([...expenses, expense]);
  };

  const handleFinish = async () => {
    try {
      // Save accounts
      for (const account of accounts) {
        await fetch("/api/finance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "add-account", account }),
        });
      }

      // Save income sources
      for (const income of incomeSources) {
        await fetch("/api/config/income", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(income),
        });
      }

      // Save expenses
      for (const expense of expenses) {
        await fetch("/api/config/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(expense),
        });
      }

      // Onboarding complete - accounts now exist so it won't show again
      onComplete();
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    }
  };

  const steps: { id: OnboardingStep; title: string; number: number }[] = [
    { id: "welcome", title: "Welkom", number: 1 },
    { id: "accounts", title: "Rekeningen", number: 2 },
    { id: "income", title: "Inkomsten", number: 3 },
    { id: "expenses", title: "Uitgaven", number: 4 },
    { id: "complete", title: "Klaar", number: 5 },
  ];

  const currentStepNumber =
    steps.find((s) => s.id === currentStep)?.number || 1;

  return (
    <div className="fixed inset-0 bg-base-300 z-50 overflow-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-2xl w-full max-w-4xl">
          {/* Progress Bar */}
          <div className="p-6 border-b border-base-300">
            <ul className="steps steps-horizontal w-full">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className={`step ${
                    currentStepNumber >= step.number ? "step-primary" : ""
                  }`}
                  data-content={
                    currentStepNumber > step.number ? "✓" : step.number
                  }
                >
                  {step.title}
                </li>
              ))}
            </ul>
          </div>

          {/* Content */}
          <div className="p-8">
            {currentStep === "welcome" && (
              <WelcomeStep onNext={() => setCurrentStep("accounts")} />
            )}

            {currentStep === "accounts" && (
              <AccountsStep
                accounts={accounts}
                onAdd={handleAccountAdd}
                onRemove={(index) =>
                  setAccounts(accounts.filter((_, i) => i !== index))
                }
                onNext={() => setCurrentStep("income")}
                onBack={() => setCurrentStep("welcome")}
              />
            )}

            {currentStep === "income" && (
              <IncomeStep
                incomeSources={incomeSources}
                onAdd={handleIncomeAdd}
                onRemove={(index) =>
                  setIncomeSources(incomeSources.filter((_, i) => i !== index))
                }
                onNext={() => setCurrentStep("expenses")}
                onBack={() => setCurrentStep("accounts")}
              />
            )}

            {currentStep === "expenses" && (
              <ExpensesStep
                expenses={expenses}
                onAdd={handleExpenseAdd}
                onRemove={(index) =>
                  setExpenses(expenses.filter((_, i) => i !== index))
                }
                onNext={() => setCurrentStep("complete")}
                onBack={() => setCurrentStep("income")}
              />
            )}

            {currentStep === "complete" && (
              <CompleteStep
                accountsCount={accounts.length}
                incomeCount={incomeSources.length}
                expensesCount={expenses.length}
                onFinish={handleFinish}
                onBack={() => setCurrentStep("expenses")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Welcome Step
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">💰</div>
      <h1 className="text-4xl font-bold text-primary">
        Welkom bij Micro Finance!
      </h1>
      <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
        Laten we je financiële toekomst plannen. Deze wizard helpt je om je
        rekeningen, inkomsten en uitgaven in te stellen.
      </p>

      <div className="alert alert-info">
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
          ></path>
        </svg>
        <div className="text-left">
          <h3 className="font-bold">Belangrijk: Configuratie eerst!</h3>
          <p className="text-sm">
            Deze app werkt met <strong>handmatig geconfigureerde</strong>{" "}
            bedragen, niet met berekeningen uit transacties. Jij vertelt ons wat
            je salaris, huur, etc. zijn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="card bg-base-200 p-4">
          <div className="text-3xl mb-2">🏦</div>
          <h3 className="font-semibold">Rekeningen</h3>
          <p className="text-sm text-base-content/70">
            Stel je huidige saldo's in
          </p>
        </div>
        <div className="card bg-base-200 p-4">
          <div className="text-3xl mb-2">💵</div>
          <h3 className="font-semibold">Inkomsten</h3>
          <p className="text-sm text-base-content/70">
            Configureer je salaris en andere inkomsten
          </p>
        </div>
        <div className="card bg-base-200 p-4">
          <div className="text-3xl mb-2">🏠</div>
          <h3 className="font-semibold">Uitgaven</h3>
          <p className="text-sm text-base-content/70">
            Voer je vaste lasten en abonnementen in
          </p>
        </div>
      </div>

      <button onClick={onNext} className="btn btn-primary btn-lg mt-8">
        Laten we beginnen! →
      </button>
    </div>
  );
}

// Accounts Step
function AccountsStep({
  accounts,
  onAdd,
  onRemove,
  onNext,
  onBack,
}: {
  accounts: Omit<Account, "id">[];
  onAdd: (account: Omit<Account, "id">) => void;
  onRemove: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking" as Account["type"],
    startingBalance: "",
    startDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      type: formData.type,
      startingBalance: parseFloat(formData.startingBalance) || 0,
      startDate: formData.startDate,
      description: formData.description || undefined,
    });
    setFormData({
      name: "",
      type: "checking",
      startingBalance: "",
      startDate: new Date().toISOString().split("T")[0],
      description: "",
    });
    setShowForm(false);
  };

  const accountTypes = [
    { value: "checking", label: "Lopende rekening", icon: "🏦" },
    { value: "savings", label: "Spaarrekening", icon: "💰" },
    { value: "crypto", label: "Crypto", icon: "₿" },
    { value: "stocks", label: "Aandelen", icon: "📈" },
    { value: "debt", label: "Schuld", icon: "💳" },
    { value: "other", label: "Overig", icon: "📝" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Voeg je rekeningen toe</h2>
        <p className="text-base-content/70">
          Stel je huidige saldo's in. Dit zijn je startpunten - geen
          berekeningen!
        </p>
      </div>

      {/* Added Accounts List */}
      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map((account, index) => {
            const typeInfo = accountTypes.find((t) => t.value === account.type);
            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-base-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeInfo?.icon}</span>
                  <div>
                    <h4 className="font-semibold">{account.name}</h4>
                    <p className="text-sm text-base-content/70">
                      {typeInfo?.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">
                    €{account.startingBalance.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onRemove(index)}
                    className="btn btn-ghost btn-sm btn-circle text-error"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Form */}
      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="card bg-base-200 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold">Nieuwe Rekening</h3>

          <div>
            <label className="label-text">Naam</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input input-bordered w-full"
              placeholder="bijv. ING Lopende Rekening"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Type</label>
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
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">Huidig Saldo (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.startingBalance}
                onChange={(e) =>
                  setFormData({ ...formData, startingBalance: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost flex-1"
            >
              Annuleren
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Toevoegen
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-outline btn-block"
        >
          + Rekening Toevoegen
        </button>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="btn btn-ghost">
          ← Terug
        </button>
        <button
          onClick={onNext}
          disabled={accounts.length === 0}
          className="btn btn-primary"
        >
          Volgende: Inkomsten →
        </button>
      </div>

      {accounts.length === 0 && (
        <div className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Voeg minimaal één rekening toe om verder te gaan</span>
        </div>
      )}
    </div>
  );
}

// Income Step
function IncomeStep({
  incomeSources,
  onAdd,
  onRemove,
  onNext,
  onBack,
}: {
  incomeSources: Omit<IncomeSource, "id">[];
  onAdd: (income: Omit<IncomeSource, "id">) => void;
  onRemove: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    frequency: "monthly" as IncomeSource["frequency"],
    dayOfMonth: "",
    startDate: new Date().toISOString().split("T")[0],
    category: "salary" as IncomeSource["category"],
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      amount: parseFloat(formData.amount) || 0,
      frequency: formData.frequency,
      dayOfMonth: formData.dayOfMonth
        ? parseInt(formData.dayOfMonth)
        : undefined,
      startDate: formData.startDate,
      isActive: true,
      category: formData.category,
      notes: formData.notes || undefined,
    });
    setFormData({
      name: "",
      amount: "",
      frequency: "monthly",
      dayOfMonth: "",
      startDate: new Date().toISOString().split("T")[0],
      category: "salary",
      notes: "",
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Configureer je inkomsten</h2>
        <p className="text-base-content/70">
          Voeg je salaris en andere terugkerende inkomsten toe
        </p>
      </div>

      {/* Added Income List */}
      {incomeSources.length > 0 && (
        <div className="space-y-2">
          {incomeSources.map((income, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg"
            >
              <div>
                <h4 className="font-semibold">{income.name}</h4>
                <p className="text-sm text-base-content/70 capitalize">
                  {income.frequency}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-success">
                  €{income.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => onRemove(index)}
                  className="btn btn-ghost btn-sm btn-circle text-error"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Income Form */}
      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="card bg-base-200 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold">Nieuwe Inkomstenbron</h3>

          <div>
            <label className="label-text">Naam</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input input-bordered w-full"
              placeholder="bijv. Salaris - Bedrijfsnaam"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="2800.00"
                required
              />
            </div>

            <div>
              <label className="label-text">Frequentie</label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as any })
                }
                className="select select-bordered w-full"
              >
                <option value="weekly">Wekelijks</option>
                <option value="biweekly">Tweewekelijks</option>
                <option value="monthly">Maandelijks</option>
                <option value="quarterly">Kwartaal</option>
                <option value="yearly">Jaarlijks</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost flex-1"
            >
              Annuleren
            </button>
            <button type="submit" className="btn btn-success flex-1">
              Toevoegen
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-outline btn-block"
        >
          + Inkomsten Toevoegen
        </button>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="btn btn-ghost">
          ← Terug
        </button>
        <button onClick={onNext} className="btn btn-primary">
          {incomeSources.length > 0 ? "Volgende: Uitgaven →" : "Overslaan →"}
        </button>
      </div>
    </div>
  );
}

// Expenses Step
function ExpensesStep({
  expenses,
  onAdd,
  onRemove,
  onNext,
  onBack,
}: {
  expenses: Omit<RecurringExpense, "id">[];
  onAdd: (expense: Omit<RecurringExpense, "id">) => void;
  onRemove: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "rent",
    amount: "",
    frequency: "monthly" as RecurringExpense["frequency"],
    startDate: new Date().toISOString().split("T")[0],
    isEssential: true,
    isVariable: false,
  });

  // Common expense categories
  const expenseCategories = [
    { value: "rent", label: "Huur", icon: "🏠" },
    { value: "utilities", label: "Energie & Water", icon: "⚡" },
    { value: "groceries", label: "Boodschappen", icon: "🛒" },
    { value: "health-insurance", label: "Zorgverzekering", icon: "🏥" },
    { value: "insurance", label: "Andere Verzekeringen", icon: "🛡️" },
    { value: "public-transport", label: "OV / Transport", icon: "🚆" },
    { value: "phone-internet", label: "Telefoon & Internet", icon: "📱" },
    { value: "subscriptions", label: "Abonnementen", icon: "📺" },
    { value: "gym", label: "Sport & Fitness", icon: "💪" },
    { value: "loan-payment", label: "Lening Aflossing", icon: "💳" },
    { value: "childcare", label: "Kinderopvang", icon: "👶" },
    { value: "education", label: "Onderwijs", icon: "📚" },
    { value: "savings-transfer", label: "Sparen", icon: "💰" },
    { value: "other", label: "Overig", icon: "📝" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      category: formData.category,
      amount: parseFloat(formData.amount) || 0,
      frequency: formData.frequency,
      startDate: formData.startDate,
      isActive: true,
      isEssential: formData.isEssential,
      isVariable: formData.isVariable,
    });
    setFormData({
      name: "",
      category: "rent",
      amount: "",
      frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      isEssential: true,
      isVariable: false,
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Voeg je vaste lasten toe</h2>
        <p className="text-base-content/70">
          Huur, verzekeringen, abonnementen, etc.
        </p>
      </div>

      {/* Added Expenses List */}
      {expenses.length > 0 && (
        <div className="space-y-2">
          {expenses.map((expense, index) => {
            const catInfo = expenseCategories.find(
              (c) => c.value === expense.category
            );
            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-error/10 border border-error/20 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{catInfo?.icon || "📝"}</span>
                  <div>
                    <h4 className="font-semibold">{expense.name}</h4>
                    <p className="text-sm text-base-content/70 capitalize">
                      {catInfo?.label || expense.category} · {expense.frequency}
                      {expense.isEssential && (
                        <span className="ml-2 badge badge-error badge-xs">
                          Essentieel
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-error">
                    €{expense.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onRemove(index)}
                    className="btn btn-ghost btn-sm btn-circle text-error"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Expense Form */}
      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="card bg-base-200 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold">Nieuwe Vaste Last</h3>

          <div>
            <label className="label-text">Naam</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input input-bordered w-full"
              placeholder="bijv. Huur - Patrimonium"
              required
            />
          </div>

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
              {expenseCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <label className="label-text-alt text-info">
              Kies de beste match - je kunt dit later aanpassen
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="727.33"
                required
              />
            </div>

            <div>
              <label className="label-text">Frequentie</label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as any })
                }
                className="select select-bordered w-full"
              >
                <option value="weekly">Wekelijks</option>
                <option value="biweekly">Tweewekelijks</option>
                <option value="monthly">Maandelijks</option>
                <option value="quarterly">Kwartaal</option>
                <option value="yearly">Jaarlijks</option>
              </select>
            </div>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">
                Essentiële uitgave (niet te vermijden)
              </span>
              <input
                type="checkbox"
                checked={formData.isEssential}
                onChange={(e) =>
                  setFormData({ ...formData, isEssential: e.target.checked })
                }
                className="checkbox checkbox-primary"
              />
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost flex-1"
            >
              Annuleren
            </button>
            <button type="submit" className="btn btn-error flex-1">
              Toevoegen
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-outline btn-block"
        >
          + Uitgave Toevoegen
        </button>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="btn btn-ghost">
          ← Terug
        </button>
        <button onClick={onNext} className="btn btn-primary">
          Volgende: Voltooien →
        </button>
      </div>
    </div>
  );
}

// Complete Step
function CompleteStep({
  accountsCount,
  incomeCount,
  expensesCount,
  onFinish,
  onBack,
}: {
  accountsCount: number;
  incomeCount: number;
  expensesCount: number;
  onFinish: () => void;
  onBack: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    await onFinish();
  };

  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold">Je bent er bijna!</h2>
      <p className="text-lg text-base-content/70">
        Controleer je instellingen en klik op "Voltooien" om te beginnen.
      </p>

      <div className="stats stats-vertical lg:stats-horizontal shadow mx-auto">
        <div className="stat">
          <div className="stat-title">Rekeningen</div>
          <div className="stat-value text-primary">{accountsCount}</div>
          <div className="stat-desc">Geconfigureerd</div>
        </div>

        <div className="stat">
          <div className="stat-title">Inkomsten</div>
          <div className="stat-value text-success">{incomeCount}</div>
          <div className="stat-desc">Bronnen</div>
        </div>

        <div className="stat">
          <div className="stat-title">Uitgaven</div>
          <div className="stat-value text-error">{expensesCount}</div>
          <div className="stat-desc">Vaste lasten</div>
        </div>
      </div>

      <div className="alert alert-success">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="text-left">
          <h3 className="font-bold">Wat kun je nu doen?</h3>
          <ul className="text-sm list-disc list-inside">
            <li>Bekijk je financiële projecties op het dashboard</li>
            <li>Importeer CSV bestanden als referentie (optioneel)</li>
            <li>Stel spaar doelen in</li>
            <li>Voeg meer inkomsten en uitgaven toe in Instellingen</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="btn btn-ghost" disabled={saving}>
          ← Terug
        </button>
        <button
          onClick={handleFinish}
          className="btn btn-primary btn-lg"
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="loading loading-spinner"></span>
              Opslaan...
            </>
          ) : (
            <>Voltooien en Beginnen! 🚀</>
          )}
        </button>
      </div>
    </div>
  );
}
