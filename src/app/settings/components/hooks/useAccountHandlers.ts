import { Account } from "@/types/finance";
import { createAccount } from "../api/createAccount";
import { updateAccount } from "../api/updateAccount";
import { deleteAccount } from "../api/deleteAccount";

export function useAccountHandlers(
  onUpdate: () => void,
  setIsCreating: (v: boolean) => void,
  setEditingAccount: (v: Account | null) => void
) {
  const handleCreate = async (account: Omit<Account, "id">) => {
    await createAccount(account, () => {
      onUpdate();
      setIsCreating(false);
    });
  };

  const handleUpdate = async (account: Account) => {
    await updateAccount(account, () => {
      onUpdate();
      setEditingAccount(null);
    });
  };

  const handleDelete = async (accountId: string) => {
    await deleteAccount(accountId, onUpdate);
  };

  return { handleCreate, handleUpdate, handleDelete };
}
