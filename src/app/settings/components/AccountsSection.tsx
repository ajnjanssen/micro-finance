"use client";

import { useState } from "react";
import { Account } from "@/types/finance";
import { useAccountHandlers } from "./hooks/useAccountHandlers";
import SectionHeader from "./ui/SectionHeader";
import AccountTable from "./tables/AccountTable";
import AccountForm from "./AccountForm";

interface AccountsSectionProps {
  accounts: Account[];
  onUpdate: () => void;
}

export default function AccountsSection({ accounts, onUpdate }: AccountsSectionProps) {
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { handleCreate, handleUpdate, handleDelete } = useAccountHandlers(onUpdate, setIsCreating, setEditingAccount);

  return (
    <div>
      <SectionHeader title="Accounts Management" buttonLabel="Add Account" onButtonClick={() => setIsCreating(true)} />
      <AccountTable accounts={accounts} onEdit={setEditingAccount} onDelete={handleDelete} />
      {(isCreating || editingAccount) && (
        <AccountForm
          account={editingAccount}
          onSave={isCreating ? handleCreate : handleUpdate}
          onCancel={() => { setIsCreating(false); setEditingAccount(null); }}
        />
      )}
    </div>
  );
}
