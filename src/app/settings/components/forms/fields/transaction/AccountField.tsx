import { Account } from "@/types/finance";
import Select from "@/components/ui/Select";

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
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-bordered"
        required
      >
        <option value="">Select Account</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
