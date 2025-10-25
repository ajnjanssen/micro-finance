import { Account } from "@/types/finance";

export function useAccountForm(account?: Account | null) {
  const getInitialData = () => ({
    name: account?.name || "",
    type: account?.type || "checking",
    description: account?.description || "",
  });

  const prepareSubmitData = (
    formData: any,
    account?: Account | null
  ) => {
    if (account) {
      return { ...account, ...formData };
    }
    return { ...formData, id: `account-${Date.now()}` };
  };

  return { getInitialData, prepareSubmitData };
}
