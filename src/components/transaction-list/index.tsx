"use client";

import type { Transaction, Account, Category } from "@/types/finance";
import { useTransactionFilters } from "./hooks/useTransactionFilters";
import { useTransactionHelpers } from "./hooks/useTransactionHelpers";
import { FilterBar } from "./FilterBar";
import { TransactionRow } from "./TransactionRow";
import { formatCurrency } from "@/utils/formatters";

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
  const {
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    sortedTransactions,
  } = useTransactionFilters(transactions);

  const {
    getAccountName,
    getCategoryName,
    getCategoryColor,
    getCategoryDaisyUIClasses,
    getRecurringLabel,
  } = useTransactionHelpers(accounts, categories);

  // Calculate totals from filtered/sorted transactions (excluding transfers)
  const totals = sortedTransactions.reduce(
    (acc, transaction) => {
      // Skip transfers as they don't represent income or expenses
      if (transaction.type !== "transfer") {
        if (transaction.amount > 0) {
          acc.income += transaction.amount;
        } else {
          acc.expenses += Math.abs(transaction.amount);
        }
        acc.net += transaction.amount;
      }
      return acc;
    },
    { income: 0, expenses: 0, net: 0 }
  );

  if (transactions.length === 0) {
    return (
      <div className="text-center text-base-content/70 py-8">
        Geen transacties gevonden
      </div>
    );
  }

  return (
    <div>
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={categories}
      />

      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Beschrijving</th>
              <th>Categorie</th>
              <th>Bedrag</th>
              <th>Type</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                getAccountName={getAccountName}
                getCategoryName={getCategoryName}
                getCategoryColor={getCategoryColor}
                getCategoryDaisyUIClasses={getCategoryDaisyUIClasses}
                getRecurringLabel={getRecurringLabel}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-base-200">
              <td colSpan={3} className="text-right">
                Totaal:
              </td>
              <td className="font-mono">
                <div className="flex flex-col gap-1">
                  <span className="text-success">
                    Inkomsten: {formatCurrency(totals.income)}
                  </span>
                  <span className="text-error">
                    Uitgaven: {formatCurrency(-totals.expenses)}
                  </span>
                  <span
                    className={totals.net >= 0 ? "text-success" : "text-error"}
                  >
                    Netto: {formatCurrency(totals.net)}
                  </span>
                </div>
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
