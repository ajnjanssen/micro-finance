import { formatCurrency } from "@/utils/formatters";
import type { MonthlyOverview } from "@/types/finance";

interface MonthlyOverviewCardProps {
  overview: MonthlyOverview | null;
}

export function MonthlyOverviewCard({ overview }: MonthlyOverviewCardProps) {
  if (!overview) return null;

  const hasActualData =
    overview.actualIncome !== undefined ||
    overview.actualExpenses !== undefined;

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            Maandoverzicht: {overview.month}
          </h3>
          <div
            className="tooltip tooltip-left"
            data-tip="Dit toont je geplande inkomsten en uitgaven voor deze maand. 'Geconfigureerd' = terugkerende transacties in je budget. 'Werkelijk' = voltooide transacties."
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-base-content/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="stats shadow w-full">
          <div className="stat">
            <div className="stat-title">Inkomsten</div>
            <div className="stat-value text-success">
              {formatCurrency(overview.totalIncome)}
            </div>
            <div className="stat-desc">Terugkerend (maandelijks)</div>
            {hasActualData && overview.actualIncome !== undefined && (
              <div className="stat-desc text-xs mt-1">
                Werkelijk ontvangen: {formatCurrency(overview.actualIncome)}
              </div>
            )}
          </div>
          <div className="stat">
            <div className="stat-title">Uitgaven</div>
            <div className="stat-value text-error">
              {formatCurrency(overview.totalExpenses)}
            </div>
            <div className="stat-desc">Terugkerend (maandelijks)</div>
            {hasActualData && overview.actualExpenses !== undefined && (
              <div className="stat-desc text-xs mt-1">
                Werkelijk uitgegeven: {formatCurrency(overview.actualExpenses)}
              </div>
            )}
          </div>
          <div className="stat">
            <div className="stat-title">Netto Groei</div>
            <div
              className={`stat-value ${
                overview.netAmount >= 0 ? "text-success" : "text-error"
              }`}
            >
              {formatCurrency(overview.netAmount)}
            </div>
            <div className="stat-desc">Verwacht per maand</div>
            {hasActualData &&
              overview.actualIncome !== undefined &&
              overview.actualExpenses !== undefined && (
                <div className="stat-desc text-xs mt-1">
                  Werkelijk:{" "}
                  {formatCurrency(
                    overview.actualIncome - overview.actualExpenses
                  )}
                </div>
              )}
          </div>
        </div>
        <div className="mt-4 p-3 bg-info/10 rounded-lg border-l-4 border-info">
          <p className="text-sm text-base-content/70">
            <strong>💡 Uitleg:</strong> Deze bedragen zijn gebaseerd op je
            terugkerende inkomsten en uitgaven. Het "Netto Groei" bedrag (
            {formatCurrency(overview.netAmount)}) is hoeveel je vermogen elke
            maand groeit als alles volgens plan verloopt.
          </p>
        </div>
      </div>
    </div>
  );
}
