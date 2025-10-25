import { Transaction } from "@/types/finance";
import { formatCurrency } from "../utils/formatCurrency";

interface TransactionTableRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionTableRow({ transaction, onEdit, onDelete }: TransactionTableRowProps) {
  return (
    <tr key={transaction.id}>
      <td>{new Date(transaction.date).toLocaleDateString()}</td>
      <td className="max-w-xs truncate">{transaction.description}</td>
      <td className={transaction.type === "income" ? "text-success" : "text-error"}>
        {transaction.type === "income" ? "+" : ""}
        {formatCurrency(transaction.amount)}
      </td>
      <td>
        <span className={`badge ${transaction.type === "income" ? "badge-success" : "badge-error"}`}>
          {transaction.type}
        </span>
      </td>
      <td>{transaction.category}</td>
      <td>
        <div className="flex gap-2">
          <button onClick={() => onEdit(transaction)} className="btn btn-xs btn-outline">
            Edit
          </button>
          <button onClick={() => onDelete(transaction.id)} className="btn btn-xs btn-error">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
