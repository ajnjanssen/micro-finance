import { useState, useEffect } from "react";
import { FinancialData } from "@/types/finance";
import { calculateAccountBalances } from "@/services/account-balance";

export function useAccountBalances(financialData: FinancialData | null) {
  const [accountBalances, setAccountBalances] = useState<{ [accountId: string]: number }>({});

  useEffect(() => {
    if (!financialData) return;

    setAccountBalances(
      calculateAccountBalances(
        financialData.accounts,
        financialData.transactions
      )
    );
  }, [financialData]);

  const totalBalance = Object.values(accountBalances).reduce((sum, balance) => sum + balance, 0);

  return { accountBalances, totalBalance };
}
