"use client";

import { useState, useEffect } from "react";
import TransactionList from "@/components/TransactionList";
import TransactionForm from "@/components/TransactionForm";
import { FinancialData, Transaction } from "@/types/finance";

export default function TransactionsPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const [financeResponse, categoriesResponse] = await Promise.all([
        fetch("/api/finance"),
        fetch("/api/settings/categories"),
      ]);

      const data = await financeResponse.json();
      const categories = await categoriesResponse.json();

      setFinancialData({
        ...data,
        categories: Array.isArray(categories)
          ? categories
          : data.categories || [],
      });
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
        setEditingTransaction(null);
      } else {
        console.error("Failed to add transaction");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm("Weet je zeker dat je deze transactie wilt verwijderen?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/settings/transactions/${transactionId}`,
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

  const handleCompleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(
        `/api/settings/transactions/${transactionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: true,
            completedDate: new Date().toISOString().split("T")[0],
          }),
        }
      );

      if (response.ok) {
        await loadFinancialData();
      } else {
        console.error("Failed to mark transaction as completed");
      }
    } catch (error) {
      console.error("Error completing transaction:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-base-300 rounded w-1/4"></div>
          <div className="h-64 bg-base-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="min-h-screen p-6">
        <div className="alert alert-error">
          <span>Kan financiële data niet laden</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-base-content">Transacties</h1>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowTransactionForm(true);
            }}
            className="btn btn-primary"
          >
            + Nieuwe Transactie
          </button>
        </div>

        {showTransactionForm && (
          <div className="card p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingTransaction ? "Bewerk Transactie" : "Nieuwe Transactie"}
              </h2>
              <button
                onClick={() => {
                  setShowTransactionForm(false);
                  setEditingTransaction(null);
                }}
                className="btn btn-sm btn-ghost"
              >
                ✕
              </button>
            </div>
            <TransactionForm
              accounts={financialData.accounts}
              categories={financialData.categories}
              accountBalances={{}}
              onSubmit={handleAddTransaction}
              onCancel={() => {
                setShowTransactionForm(false);
                setEditingTransaction(null);
              }}
              editTransaction={editingTransaction || undefined}
            />
          </div>
        )}

        <TransactionList
          transactions={financialData.transactions}
          accounts={financialData.accounts}
          categories={financialData.categories}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          onComplete={handleCompleteTransaction}
        />
      </div>
    </div>
  );
}
