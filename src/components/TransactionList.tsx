"use client";

import { Transaction, Account, Category } from "@/types/finance";
import { useState } from "react";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  onComplete?: (transactionId: string) => void;
}

export default function TransactionList({
  transactions,
  accounts,
  categories,
  onEdit,
  onDelete,
  onComplete,
}: TransactionListProps) {
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account ? account.name : "Onbekend";
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Onbekend";
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.color : "#6B7280";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getRecurringLabel = (transaction: Transaction) => {
    if (!transaction.isRecurring) return "";

    switch (transaction.recurringType) {
      case "monthly":
        return "📅 Maandelijks";
      case "yearly":
        return "📅 Jaarlijks";
      case "weekly":
        return "📅 Wekelijks";
      case "daily":
        return "📅 Dagelijks";
      default:
        return "📅 Terugkerend";
    }
  };

  // Filter transacties
  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "all") {
      // Apply category filter
      if (categoryFilter !== "all" && transaction.category !== categoryFilter) {
        return false;
      }
      return true;
    }
    if (filter === "income") {
      if (transaction.type !== "income") return false;
    } else if (filter === "expense") {
      if (transaction.type !== "expense") return false;
    } else if (filter === "recurring") {
      if (!transaction.isRecurring) return false;
    }

    // Apply category filter
    if (categoryFilter !== "all" && transaction.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  // Sorteer transacties
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "date-asc":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "amount-desc":
        return Math.abs(b.amount) - Math.abs(a.amount);
      case "amount-asc":
        return Math.abs(a.amount) - Math.abs(b.amount);
      default:
        return 0;
    }
  });

  return (
    <div className="card">
      <div className="">
        <div className="flex justify-between items-center">
          <span className="text-sm text-base-content">
            {filteredTransactions.length} van {transactions.length} transacties
          </span>
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="label">
              <span className="label-text">Filter</span>
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="all">Alle transacties</option>
              <option value="income">Alleen inkomsten</option>
              <option value="expense">Alleen uitgaven</option>
              <option value="recurring">Alleen terugkerend</option>
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Categorie</span>
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="all">Alle categorieën</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Sorteer op</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="date-desc">Datum (nieuwste eerst)</option>
              <option value="date-asc">Datum (oudste eerst)</option>
              <option value="amount-desc">Bedrag (hoogste eerst)</option>
              <option value="amount-asc">Bedrag (laagste eerst)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {sortedTransactions.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-base-content">Geen transacties gevonden</p>
            <p className="text-sm text-base-content">
              Voeg je eerste transactie toe om te beginnen
            </p>
          </div>
        ) : (
          <table className="table table-zebra">
            <thead>
              <tr>
                <th className="text-left">Datum</th>
                <th className="text-left">Omschrijving</th>
                <th className="text-left">Categorie</th>
                <th className="text-left">Rekening</th>
                <th className="text-right">Bedrag</th>
                <th className="text-center">Acties</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className={`hover ${
                    transaction.completed ? "opacity-60" : ""
                  }`}
                >
                  <td className="text-base-content">
                    <div className="flex items-center gap-2">
                      {transaction.completed && (
                        <span className="text-success text-lg" title="Voltooid">
                          ✓
                        </span>
                      )}
                      <span>{formatDate(transaction.date)}</span>
                    </div>
                    {transaction.completed && transaction.completedDate && (
                      <div className="text-xs text-success">
                        Voltooid: {formatDate(transaction.completedDate)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-base-content">
                          {transaction.description}
                        </div>
                        {transaction.isRecurring && (
                          <div className="text-xs text-primary">
                            {getRecurringLabel(transaction)}
                          </div>
                        )}
                        {transaction.tags && transaction.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {transaction.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="badge badge-ghost text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                            {transaction.tags.length > 2 && (
                              <span className="text-xs text-base-content">
                                +{transaction.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: getCategoryColor(transaction.category),
                      }}
                    >
                      {getCategoryName(transaction.category)}
                    </span>
                  </td>
                  <td className="text-base-content">
                    {getAccountName(transaction.accountId)}
                  </td>
                  <td className="text-right">
                    <span
                      className={`font-semibold ${
                        transaction.amount > 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}€
                      {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="text-center">
                    {(onEdit || onDelete || onComplete) && (
                      <div className="flex justify-center space-x-2">
                        {onComplete && !transaction.completed && (
                          <button
                            onClick={() => onComplete(transaction.id)}
                            className="btn btn-sm btn-success"
                            title="Markeer als voltooid"
                          >
                            ✓
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(transaction)}
                            className="btn btn-sm btn-primary"
                          >
                            ✏️
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(transaction.id)}
                            className="btn btn-sm btn-error"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
