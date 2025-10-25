import { Account } from "@/types/finance";

export function handleAccountSubmit(
  e: React.FormEvent,
  formData: { name: string; type: string; description: string },
  account: Account | null | undefined,
  prepareSubmitData: (
    data: { name: string; type: string; description: string },
    account: Account | null | undefined
  ) => any,
  onSave: (account: any) => void
) {
  e.preventDefault();
  onSave(prepareSubmitData(formData, account));
}
