/**
 * Dashboard Header Component
 * Max 50 lines per NASA standard
 */

interface DashboardHeaderProps {
  currentBalance: number;
  projectionMonths: number;
  onMonthsChange: (months: number) => void;
}

export function DashboardHeader({
  currentBalance,
  projectionMonths,
  onMonthsChange,
}: DashboardHeaderProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-base-content">Dashboard</h1>
        <p className="text-base-content/70 mt-1">
          Huidig saldo: {formatCurrency(currentBalance)}
        </p>
      </div>

      <div className="form-control w-48">
        <label className="label">
          <span className="label-text">Projectie periode</span>
        </label>
        <select
          className="select select-bordered"
          value={projectionMonths}
          onChange={(e) => onMonthsChange(Number(e.target.value))}
        >
          <option value={12}>12 maanden</option>
          <option value={24}>24 maanden</option>
          <option value={36}>36 maanden</option>
        </select>
      </div>
    </div>
  );
}
