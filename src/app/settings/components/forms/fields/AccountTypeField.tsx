import { Account } from "@/types/finance";

interface AccountTypeFieldProps {
  value: Account["type"];
  onChange: (value: Account["type"]) => void;
}

export default function AccountTypeField({
  value,
  onChange,
}: AccountTypeFieldProps) {
  return (
    <div>
      <label className="label">
        <span className="label-text">Type</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Account["type"])}
        className="select select-bordered w-full"
      >
        <option value="checking">Checking</option>
        <option value="savings">Savings</option>
        <option value="crypto">Crypto</option>
        <option value="stocks">Stocks</option>
        <option value="debt">Debt</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
}
