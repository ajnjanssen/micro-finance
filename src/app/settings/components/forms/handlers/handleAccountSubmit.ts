import type { Account } from "@/types/finance";

export function handleAccountSubmit(
  e: React.FormEvent,
  formData: {
    name: string;
    type: Account["type"];
    description: string;
    startingBalance: string;
    startDate: string;
    expectedAnnualReturn: number;
  },
  account: Account | null | undefined,
  prepareSubmitData: (
    data: {
      name: string;
      type: Account["type"];
      description: string;
      startingBalance: string;
      startDate: string;
      expectedAnnualReturn: number;
    },
    account: Account | null | undefined,
  ) => Account,
  onSave: (account: Account) => void,
) {
  e.preventDefault();
  onSave(prepareSubmitData(formData, account));
}
