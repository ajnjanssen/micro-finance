import type { Account } from "@/types/finance";

export function useAccountForm(account?: Account | null) {
  const getInitialData = () => ({
    name: account?.name || "",
    type: account?.type || "checking",
    description: account?.description || "",
    startingBalance: String(account?.startingBalance ?? 0),
    startDate: account?.startDate || new Date().toISOString().slice(0, 10),
    expectedAnnualReturn: account?.expectedAnnualReturn ?? 0,
  });

  const prepareSubmitData = (
    formData: {
      name: string;
      type: Account["type"];
      description: string;
      startingBalance: string;
      startDate: string;
      expectedAnnualReturn: number;
    },
    account?: Account | null,
  ) => {
    const accountValues = {
      ...formData,
      startingBalance: Number(formData.startingBalance) || 0,
      expectedAnnualReturn:
        formData.type === "stocks" ? formData.expectedAnnualReturn : undefined,
    };
    if (account) {
      return { ...account, ...accountValues };
    }
    return {
      ...accountValues,
      startDate: formData.startDate,
      id: `account-${Date.now()}`,
    };
  };

  return { getInitialData, prepareSubmitData };
}
