import { formatCurrency } from "@/utils/formatters";

interface BalanceCardProps {
  label: string;
  amount: number;
  variant?: "default" | "success" | "error" | "neutral";
}

export default function BalanceCard({ label, amount, variant = "default" }: BalanceCardProps) {
  const colorClass = {
    default: "text-base-content",
    success: "text-success",
    error: "text-error",
    neutral: "text-neutral",
  }[variant];

  return (
    <div className="stat">
      <div className="stat-title">{label}</div>
      <div className={`stat-value ${colorClass}`}>{formatCurrency(amount)}</div>
    </div>
  );
}
