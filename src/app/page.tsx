"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FinancialData } from "@/types/finance";
import TransactionForm from "@/components/TransactionForm";
import AccountOverview from "@/components/AccountOverview";
import AccountForm from "@/components/AccountForm";
import TransactionList from "@/components/TransactionList";
import Dashboard from "@/components/Dashboard";
import ExpensePredictions from "@/components/ExpensePredictions";
import BudgetPlanner from "@/components/BudgetPlanner";
import Navigation from "@/components/Navigation";
import SavingsGoals from "@/components/SavingsGoals";
import AHeaderText from "@/ui/foundation/text/a-header-text";

export default function Home() {
  const searchParams = useSearchParams();
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );
  const [accountBalances, setAccountBalances] = useState<{
    [accountId: string]: number;
  }>({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadFinancialData = async () => {
    try {
      const response = await fetch("/api/finance");
      const data = await response.json();
      setFinancialData(data);

      // Calculate account balances from transactions UP TO TODAY (excluding future)
      const balances: { [accountId: string]: number } = {};
      data.accounts.forEach((account: { id: string }) => {
        balances[account.id] = 0;
      });

      // Sum only PAST and CURRENT transactions (not future ones)
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      data.transactions.forEach(
        (transaction: { accountId: string; amount: number; date: string }) => {
          const transactionDate = new Date(transaction.date);
          // Only count transactions up to today
          if (
            transactionDate <= today &&
            balances[transaction.accountId] !== undefined
          ) {
            balances[transaction.accountId] += transaction.amount;
          }
        }
      );
      setAccountBalances(balances);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleAddTransaction = async (transaction: any) => {
    try {
      const response = await fetch("/api/finance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "add-transaction",
          transaction,
        }),
      });

      if (response.ok) {
        await loadFinancialData();
        setShowTransactionForm(false);
      } else {
        console.error("Failed to add transaction");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleAddAccount = async (account: any) => {
    try {
      const response = await fetch("/api/finance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "add-account",
          account,
        }),
      });

      if (response.ok) {
        await loadFinancialData();
        setShowAccountForm(false);
      } else {
        console.error("Failed to add account");
      }
    } catch (error) {
      console.error("Error adding account:", error);
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
    setActiveTab("transactions");
  };

  const handleUpdateTransaction = async (transaction: any) => {
    try {
      const response = await fetch("/api/finance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "update-transaction",
          id: editingTransaction.id,
          updates: transaction,
        }),
      });

      if (response.ok) {
        await loadFinancialData();
        setShowTransactionForm(false);
        setEditingTransaction(null);
      } else {
        console.error("Failed to update transaction");
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm("Weet je zeker dat je deze transactie wilt verwijderen?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/finance?id=${transactionId}&type=transaction`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await loadFinancialData();
      } else {
        console.error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleTransactionSubmit = async (transaction: any) => {
    if (editingTransaction) {
      await handleUpdateTransaction(transaction);
    } else {
      await handleAddTransaction(transaction);
    }
  };

  useEffect(() => {
    loadFinancialData();

    // Poll for file changes every 5 seconds (reduced frequency)
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/finance");
        const data = await response.json();
        const lastUpdated = data.lastUpdated;

        if (financialData && lastUpdated !== financialData.lastUpdated) {
          console.log("Financial data updated, reloading...");
          await loadFinancialData();
        }
      } catch (error) {
        // Ignore errors during polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [financialData?.lastUpdated]);

  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48 bg-gray-300 rounded"></div>
              <div className="h-48 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Fout bij het laden van financiële data
          </h1>
          <button
            onClick={loadFinancialData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Probeer opnieuw
          </button>
        </div>
      </div>
    );
  }

  const totalBalance = accountBalances["checking-1"] || 0;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-base-200">
        <header className="shadow-sm ">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-primary">
                  Micro Finance
                </h1>
                <p className="text-base-content">
                  Beheer je financiën eenvoudig
                </p>
              </div>
            </div>
          </div>
        </header>

        <Navigation
          activeTab={activeTab}
          onTabChange={(tabId) => {
            if (tabId === "upload") {
              window.location.href = "/upload";
            } else if (tabId === "settings") {
              window.location.href = "/settings";
            } else if (tabId === "categories") {
              window.location.href = "/categories";
            } else {
              setActiveTab(tabId);
            }
          }}
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "dashboard" && (
          <Dashboard currentBalance={totalBalance} />
        )}

        {activeTab === "budget" && <BudgetPlanner />}

        {activeTab === "savings" && <SavingsGoals />}

        {activeTab === "accounts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              {/* <h2 className="text-2xl font-bold text-gray-900">Rekeningen</h2> */}
              <AHeaderText>Rekeningen</AHeaderText>
              <button
                onClick={() => setShowAccountForm(!showAccountForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500"
              >
                {showAccountForm ? "Annuleren" : "+ Nieuwe Rekening"}
              </button>
            </div>

            {showAccountForm && (
              <AccountForm
                onSubmit={handleAddAccount}
                onCancel={() => setShowAccountForm(false)}
              />
            )}

            <AccountOverview
              accounts={financialData.accounts}
              totalBalance={totalBalance}
              accountBalances={accountBalances}
            />
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              {/* <h2 className="text-2xl font-bold text-gray-900">Transacties</h2> */}
              <AHeaderText>Transacties</AHeaderText>
              <button
                onClick={() => setShowTransactionForm(!showTransactionForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                {showTransactionForm ? "Annuleren" : "+ Nieuwe Transactie"}
              </button>
            </div>

            {showTransactionForm && (
              <TransactionForm
                accounts={financialData.accounts}
                categories={financialData.categories}
                accountBalances={accountBalances}
                onSubmit={handleTransactionSubmit}
                onCancel={() => {
                  setShowTransactionForm(false);
                  setEditingTransaction(null);
                }}
                editTransaction={editingTransaction}
              />
            )}

            <TransactionList
              transactions={financialData.transactions}
              accounts={financialData.accounts}
              categories={financialData.categories}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </div>
        )}

        {activeTab === "predictions" && (
          <div className="space-y-6">
            <ExpensePredictions />
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => {
            setActiveTab("transactions");
            setShowTransactionForm(true);
          }}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 flex items-center justify-center text-2xl"
          title="Snelle transactie toevoegen"
        >
          +
        </button>
      </div>
    </div>
  );
}
