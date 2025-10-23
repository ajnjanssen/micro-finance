/**
 * Current Balance Card Component
 * Max 50 lines per NASA standard
 */

interface BalanceCardProps {
  balance: number;
  title?: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

export function BalanceCard({
  balance,
  title = "Huidig Saldo",
  subtitle,
  trend = "neutral",
}: BalanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getTrendIcon = () => {
    if (trend === "up") return "📈";
    if (trend === "down") return "📉";
    return "➡️";
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-success";
    if (trend === "down") return "text-error";
    return "text-base-content";
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-lg">{title}</h2>
        <p className={`text-4xl font-bold ${getTrendColor()}`}>
          {getTrendIcon()} {formatCurrency(balance)}
        </p>
        {subtitle && <p className="text-sm text-base-content/70">{subtitle}</p>}
      </div>
    </div>
  );
}
