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
    <div className="flex flex-col gap-1">
      <label className="label">
        <span className="label-text">Type</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Account["type"])}
        className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
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
