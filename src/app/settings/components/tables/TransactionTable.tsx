import { Transaction } from "@/types/finance";
import TransactionTableHeader from "./TransactionTableHeader";
import TransactionTableRow from "./TransactionTableRow";

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <TransactionTableHeader />
        <tbody>
          {transactions.slice(0, 50).map((transaction) => (
            <TransactionTableRow
              key={transaction.id}
              transaction={transaction}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
      {transactions.length > 50 && (
        <p className="text-sm text-base-content/70 mt-2">
          Showing first 50 transactions. Use filters for more specific results.
        </p>
      )}
    </div>
  );
}
