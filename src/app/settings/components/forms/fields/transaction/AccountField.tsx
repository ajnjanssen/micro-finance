import { Account } from "@/types/finance";

interface AccountFieldProps {
  value: string;
  accounts: Account[];
  onChange: (value: string) => void;
}

export default function AccountField({
  value,
  accounts,
  onChange,
}: AccountFieldProps) {
  return (
    <div>
      <label className="label">
        <span className="label-text">Account</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select select-bordered w-full"
        required
      >
        <option value="">Select Account</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
