import Select from "@/components/ui/Select";
import type { Account } from "@/types/finance";

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
      <div className="label">
        <span className="label-text">Account</span>
      </div>
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
            {acc.type === "stocks" &&
              ` (${acc.expectedAnnualReturn ?? 0}% verwacht rendement)`}
          </option>
        ))}
      </Select>
      {accounts.find((account) => account.id === value)?.type === "stocks" && (
        <p className="mt-1 text-xs text-base-content/70">
          Het rendement staat ingesteld op de beleggingsrekening en wordt niet
          per transactie toegepast.
        </p>
      )}
    </div>
  );
}
