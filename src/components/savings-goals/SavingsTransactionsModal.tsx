import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Transaction } from "@/types/finance-v2";

interface SavingsTransactionsModalProps {
  goalId: string;
  goalName: string;
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
}

export function SavingsTransactionsModal({
  goalId,
  goalName,
  transactions,
  isOpen,
  onClose,
}: SavingsTransactionsModalProps) {
  if (!isOpen) return null;

  const linkedTransactions = transactions.filter(t => t.savingsGoalId === goalId);
  const totalSaved = linkedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl">
        <h3 className="font-bold text-lg mb-4">
          Transacties voor: {goalName}
        </h3>

        {linkedTransactions.length === 0 ? (
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Nog geen transacties gekoppeld aan dit spaardoel.</span>
          </div>
        ) : (
          <>
            <div className="stats shadow mb-4 w-full">
              <div className="stat">
                <div className="stat-title">Totaal Gespaard</div>
                <div className="stat-value text-primary">{formatCurrency(totalSaved)}</div>
                <div className="stat-desc">{linkedTransactions.length} transacties</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Beschrijving</th>
                    <th>Bedrag</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedTransactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          {format(new Date(transaction.date), "dd MMM yyyy", { locale: nl })}
                        </td>
                        <td>
                          <div className="font-medium">{transaction.description}</div>
                          {transaction.isRecurring && (
                            <span className="badge badge-sm badge-info">
                              {transaction.recurringPattern?.frequency === "monthly" ? "Maandelijks" : "Terugkerend"}
                            </span>
                          )}
                        </td>
                        <td className="font-semibold text-success">
                          {formatCurrency(Math.abs(transaction.amount))}
                        </td>
                        <td>
                          <span className={`badge ${transaction.isRecurring ? "badge-primary" : "badge-ghost"}`}>
                            {transaction.isRecurring ? "Terugkerend" : "Eenmalig"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Sluiten
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
