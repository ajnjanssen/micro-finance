"use client";

import { Account } from "@/types/finance";

interface AccountOverviewProps {
  accounts: Account[];
  totalBalance: number;
  accountBalances: { [accountId: string]: number };
}

export default function AccountOverview({
  accounts,
  totalBalance,
  accountBalances,
}: AccountOverviewProps) {
  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "checking":
        return "Lopende rekening";
      case "savings":
        return "Spaarrekening";
      case "crypto":
        return "Crypto";
      case "stocks":
        return "Aandelen";
      case "debt":
        return "Schuld";
      default:
        return "Overig";
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "checking":
        return "badge badge-primary";
      case "savings":
        return "badge badge-success";
      case "crypto":
        return "badge badge-warning";
      case "stocks":
        return "badge badge-secondary";
      case "debt":
        return "badge badge-error";
      default:
        return "badge badge-neutral";
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-success";
    if (balance < 0) return "text-error";
    return "text-base-content";
  };

  // Groepeer accounts per type
  const accountsByType = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as { [key: string]: Account[] });

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-base-content">
          Rekening Overzicht
        </h2>
        <div className="text-right">
          <p className="text-sm text-base-content">Totaal Vermogen</p>
          <p className={`text-2xl font-bold ${getBalanceColor(totalBalance)}`}>
            €{totalBalance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(accountsByType).map(([type, typeAccounts]) => {
          const typeTotal = typeAccounts.reduce(
            (sum, acc) => sum + (accountBalances[acc.id] || 0),
            0
          );

          return (
            <div
              key={type}
              className="border-l-4 border-primary pl-4 bg-base-200 p-4 rounded-md"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-base-content">
                  {getAccountTypeLabel(type)}
                </h3>
                <span
                  className={`text-sm font-medium ${getBalanceColor(
                    typeTotal
                  )}`}
                >
                  €{typeTotal.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                {typeAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex justify-between items-center bg-base-200 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-base-content">
                          {account.name}
                        </span>
                        <span
                          className={`text-xs ${getAccountTypeColor(
                            account.type
                          )}`}
                        >
                          {getAccountTypeLabel(account.type)}
                        </span>
                      </div>
                      {account.description && (
                        <p className="text-sm text-base-content mt-1">
                          {account.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-lg font-semibold ${getBalanceColor(
                          accountBalances[account.id] || 0
                        )}`}
                      >
                        €{(accountBalances[account.id] || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-8 text-base-content">
          <p>Geen rekeningen gevonden</p>
          <p className="text-sm">Voeg je eerste rekening toe om te beginnen</p>
        </div>
      )}
    </div>
  );
}
