import { useState, useEffect } from "react";
import { FinancialData } from "@/types/finance";

export function useAccountBalances(financialData: FinancialData | null) {
  const [accountBalances, setAccountBalances] = useState<{ [accountId: string]: number }>({});

  useEffect(() => {
    if (!financialData) return;

    const balances: { [accountId: string]: number } = {};
    
    // Starting balances
    financialData.accounts.forEach((account) => {
      balances[account.id] = account.startingBalance || 0;
    });

    // Add completed transactions
    financialData.transactions
      .filter((tx) => tx.completed)
      .forEach((tx) => {
        if (balances[tx.accountId] !== undefined) {
          balances[tx.accountId] += tx.amount;
        }
      });

    setAccountBalances(balances);
  }, [financialData]);

  const totalBalance = Object.values(accountBalances).reduce((sum, balance) => sum + balance, 0);

  return { accountBalances, totalBalance };
}
