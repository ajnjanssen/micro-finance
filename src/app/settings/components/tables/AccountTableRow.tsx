import { Account } from "@/types/finance";

interface AccountTableRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export default function AccountTableRow({ account, onEdit, onDelete }: AccountTableRowProps) {
  return (
    <tr key={account.id}>
      <td>{account.name}</td>
      <td>
        <span className={`badge ${account.type === "checking" ? "badge-primary" : "badge-secondary"}`}>
          {account.type}
        </span>
      </td>
      <td>{account.description}</td>
      <td>
        <div className="flex gap-2">
          <button onClick={() => onEdit(account)} className="btn btn-xs btn-outline">
            Edit
          </button>
          <button onClick={() => onDelete(account.id)} className="btn btn-xs btn-error">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
