import { formatCurrency } from "@/utils/formatters";
import type { BudgetItem } from "./types";

interface SummaryStatsProps {
  budgets: BudgetItem[];
}

export function SummaryStats({ budgets }: SummaryStatsProps) {
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRecommended = budgets.reduce((sum, b) => sum + b.recommended, 0);
  const remaining = totalBudgeted - totalSpent;

  return (
    <div className="stats shadow w-full">
      <div className="stat">
        <div className="stat-title">Jouw Budget</div>
        <div className="stat-value text-primary">
          {formatCurrency(totalBudgeted)}
        </div>
        <div className="stat-desc">Wat je wilt uitgeven</div>
      </div>
      <div className="stat">
        <div className="stat-title">Uitgegeven</div>
        <div className="stat-value text-secondary">
          {formatCurrency(totalSpent)}
        </div>
        <div className="stat-desc">Tot nu toe deze maand</div>
      </div>
      <div className="stat">
        <div className="stat-title">Nog Te Besteden</div>
        <div
          className={`stat-value ${
            remaining >= 0 ? "text-success" : "text-error"
          }`}
        >
          {formatCurrency(remaining)}
        </div>
        <div className="stat-desc">
          {remaining >= 0 ? "Binnen budget" : "Over budget"}
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">Aanbevolen (50/30/20)</div>
        <div className="stat-value text-info text-2xl">
          {formatCurrency(totalRecommended)}
        </div>
        <div className="stat-desc">Gebaseerd op je inkomen</div>
      </div>
    </div>
  );
}
