import { formatCurrency } from "@/utils/formatters";
import type { BudgetItem } from "./types";

interface BudgetTableProps {
  budgets: BudgetItem[];
  selectedMonth?: string;
}

// Calculate how far through the month we are (0-100%)
function getMonthProgress(selectedMonth?: string): number {
  const now = new Date();
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth() + 1;

  // Parse selected month if provided (format: YYYY-MM)
  if (selectedMonth) {
    const [year, month] = selectedMonth.split("-").map(Number);
    targetYear = year;
    targetMonth = month;
  }

  // If it's a future month, progress is 0%
  if (
    targetYear > now.getFullYear() ||
    (targetYear === now.getFullYear() && targetMonth > now.getMonth() + 1)
  ) {
    return 0;
  }

  // If it's a past month, progress is 100%
  if (
    targetYear < now.getFullYear() ||
    (targetYear === now.getFullYear() && targetMonth < now.getMonth() + 1)
  ) {
    return 100;
  }

  // Current month: calculate based on day of month
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const currentDay = now.getDate();
  return Math.round((currentDay / daysInMonth) * 100);
}

export function BudgetTable({ budgets, selectedMonth }: BudgetTableProps) {
  const monthProgress = getMonthProgress(selectedMonth);

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Categorie</th>
            <th className="text-right">Budget</th>
            <th className="text-right">Uitgegeven</th>
            <th className="text-right">Over</th>
            <th className="text-center">
              Voortgang ({monthProgress}% van maand)
            </th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((budget, idx) => {
            const remaining = budget.budgeted - budget.spent;
            const spentPercentage =
              budget.budgeted > 0
                ? Math.round((budget.spent / budget.budgeted) * 100)
                : 0;

            // Determine progress bar color based on spending vs month progress
            let progressColor = "progress-success";
            if (spentPercentage > monthProgress + 10) {
              progressColor = "progress-error"; // Spending too fast
            } else if (spentPercentage > monthProgress) {
              progressColor = "progress-warning"; // Slightly ahead of pace
            }

            return (
              <tr key={idx}>
                <td>
                  <div>
                    <div className="font-semibold">{budget.category}</div>
                    <div className="text-xs text-base-content/70">
                      {budget.description}
                    </div>
                  </div>
                </td>
                <td className="font-mono text-right font-semibold">
                  {formatCurrency(budget.budgeted)}
                </td>
                <td className="font-mono text-right">
                  {formatCurrency(budget.spent)}
                </td>
                <td className="text-right">
                  <span
                    className={`badge ${
                      remaining >= 0 ? "badge-success" : "badge-error"
                    }`}
                  >
                    {formatCurrency(remaining)}
                  </span>
                </td>
                <td>
                  <div className="flex flex-col items-center gap-1">
                    <progress
                      className={`progress ${progressColor} w-32`}
                      value={budget.spent}
                      max={budget.budgeted}
                    />
                    <span className="text-xs">
                      {spentPercentage}% uitgegeven
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
