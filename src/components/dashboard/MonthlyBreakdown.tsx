import { formatCurrency, formatDate } from "@/utils/formatters";
import type { Account } from "@/types/finance";

interface MonthlyBreakdownProps {
  projections: Array<{
    date: string;
    totalBalance: number;
    accountBalances: { [accountId: string]: number };
  }>;
  currentBalance: number;
  accounts: Account[];
}

export function MonthlyBreakdown({
  projections,
  currentBalance,
  accounts,
}: MonthlyBreakdownProps) {
  const getBalanceColor = (balance: number) => {
    if (balance > currentBalance * 1.1) return "text-success";
    if (balance < currentBalance * 0.9) return "text-error";
    return "text-base-content";
  };

  if (projections.length === 0) return null;

  return (
    <div className="overflow-x-auto mt-4">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Maand</th>
            {accounts.map((account) => (
              <th key={account.id} className="text-right">
                {account.name}
              </th>
            ))}
            <th className="text-right font-bold">Totaal</th>
            <th className="text-right">Groei</th>
          </tr>
        </thead>
        <tbody>
          {projections.slice(1, 7).map((projection, index) => {
            const previousProjection = projections[index];
            const previousBalance = previousProjection.totalBalance;
            const monthlyChange = projection.totalBalance - previousBalance;

            return (
              <tr key={index}>
                <td className="font-medium">{formatDate(projection.date)}</td>
                {accounts.map((account) => {
                  const balance = projection.accountBalances[account.id] || 0;
                  const previousAccountBalance =
                    previousProjection.accountBalances[account.id] || 0;
                  const accountChange = balance - previousAccountBalance;

                  return (
                    <td key={account.id} className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-medium">
                          {formatCurrency(balance)}
                        </span>
                        {accountChange !== 0 && (
                          <span
                            className={`badge badge-sm ${
                              accountChange >= 0
                                ? "badge-success"
                                : "badge-error"
                            }`}
                          >
                            {accountChange >= 0 ? "+" : ""}
                            {formatCurrency(accountChange)}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td
                  className={`text-right font-bold ${getBalanceColor(
                    projection.totalBalance
                  )}`}
                >
                  {formatCurrency(projection.totalBalance)}
                </td>
                <td className="text-right">
                  {monthlyChange >= 0 ? (
                    <span className="text-success font-semibold">
                      +{formatCurrency(monthlyChange)}
                    </span>
                  ) : (
                    <span className="text-error font-semibold">
                      {formatCurrency(monthlyChange)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
