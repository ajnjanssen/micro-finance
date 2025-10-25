import { Account } from "@/types/finance";
import AccountTableHeader from "./AccountTableHeader";
import AccountTableRow from "./AccountTableRow";

interface AccountTableProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export default function AccountTable({ accounts, onEdit, onDelete }: AccountTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <AccountTableHeader />
        <tbody>
          {accounts.map((account) => (
            <AccountTableRow key={account.id} account={account} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
