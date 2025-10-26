"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import type { Debt } from "@/types/assets-liabilities";
import { useMemo } from "react";

interface DebtProjectionChartProps {
  debts: Debt[];
}

interface DebtProjectionData {
  month: number;
  date: string;
  totalDebtWithInterest?: number; // Total debt with only interest (no payments)
  totalPaid?: number; // Total amount paid so far
  totalForgiveness?: number; // Difference between debt and paid
  [debtId: string]: number | string | undefined; // Dynamic keys for each debt's balance
}

export function DebtProjectionChart({ debts }: DebtProjectionChartProps) {
  const activeDebts = useMemo(
    () =>
      debts.filter(
        (d) => d.isActive && d.monthlyPayment && d.monthlyPayment > 0
      ),
    [debts]
  );

  const projectionData = useMemo(
    () => calculateMultiDebtProjections(activeDebts),
    [activeDebts]
  );

  const { xAxisData, series } = useMemo(() => {
    if (projectionData.length === 0) {
      return { xAxisData: [], series: [] };
    }

    return {
      xAxisData: projectionData.map((d) => d.date),
      series: [
        // Total debt with interest only (no payments)
        {
          data: projectionData.map((d) => d.totalDebtWithInterest || 0),
          label: "Totale Schuld (met rente)",
          color: "#ef4444", // red
          curve: "linear" as const,
        },
        // Total paid so far
        {
          data: projectionData.map((d) => d.totalPaid || 0),
          label: "Totaal Betaald",
          color: "#3b82f6", // blue
          curve: "linear" as const,
        },
        // Forgiveness (difference)
        {
          data: projectionData.map((d) => d.totalForgiveness || 0),
          label: "Kwijtschelding",
          color: "#22c55e", // green
          curve: "linear" as const,
        },
      ],
    };
  }, [projectionData]);

  if (activeDebts.length === 0) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Schuldprojectie</h3>
          <div className="text-center py-8 text-base-content/70">
            <p>Geen actieve schulden met betalingen gevonden</p>
            <p className="text-sm">
              Voeg een maandelijkse betaling toe aan je schulden om de projectie
              te zien
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h3 className="card-title">Schuldprojectie - Balans over Tijd</h3>
        <p className="text-sm text-base-content/70 mb-4">
          Verwachte ontwikkeling van je schulden bij huidige aflossing
        </p>

        <div className="w-full bg-base-200 rounded-lg" style={{ height: 400 }}>
          <LineChart
            xAxis={[
              {
                data: xAxisData,
                scaleType: "point",
              },
            ]}
            series={series}
            height={400}
            margin={{ left: 80, right: 20, top: 20, bottom: 60 }}
          />
        </div>

        {/* Legend with explanation */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-base-200">
            <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0 bg-red-500" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">Totale Schuld (met rente)</div>
              <div className="text-sm text-base-content/70">
                Wat je zou verschuldigd zijn met alleen rente, zonder betalingen
              </div>
              <div className="text-sm font-mono mt-1">
                Eind: €
                {projectionData[
                  projectionData.length - 1
                ]?.totalDebtWithInterest?.toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-base-200">
            <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0 bg-blue-500" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">Totaal Betaald</div>
              <div className="text-sm text-base-content/70">
                Cumulatieve betalingen over 35 jaar
              </div>
              <div className="text-sm font-mono mt-1">
                Eind: €
                {projectionData[
                  projectionData.length - 1
                ]?.totalPaid?.toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-base-200">
            <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0 bg-green-500" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">Kwijtschelding</div>
              <div className="text-sm text-base-content/70">
                Het verschil dat na 35 jaar wordt kwijtgescholden
              </div>
              <div className="text-sm font-mono mt-1">
                Eind: €
                {projectionData[
                  projectionData.length - 1
                ]?.totalForgiveness?.toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate projections for multiple debts simultaneously
 */
function calculateMultiDebtProjections(debts: Debt[]): DebtProjectionData[] {
  const projectionData: DebtProjectionData[] = [];

  // Find the maximum projection period across all debts
  let maxMonths = 0;
  const debtMaxMonths: { [debtId: string]: number } = {};

  debts.forEach((debt) => {
    let months = 1200; // Default 100 years
    if (debt.endDate) {
      const startDate = new Date(debt.startDate);
      const endDate = new Date(debt.endDate);
      months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
    }
    debtMaxMonths[debt.id] = months;
    maxMonths = Math.max(maxMonths, months);
  });

  // Initialize balances and tracking
  const balancesWithoutPayment: { [debtId: string]: number } = {}; // Track debt with only interest
  const totalPaidPerDebt: { [debtId: string]: number } = {}; // Track total paid per debt

  debts.forEach((debt) => {
    balancesWithoutPayment[debt.id] = debt.currentBalance;
    totalPaidPerDebt[debt.id] = 0;
  });

  // Calculate month by month from TODAY, but only store yearly data points
  const today = new Date();

  for (let month = 0; month <= maxMonths; month++) {
    const currentMonth = new Date(today);
    currentMonth.setMonth(currentMonth.getMonth() + month);

    // Only process every 12 months (yearly) plus the first and last month
    const shouldInclude =
      month === 0 || month === maxMonths || month % 12 === 0;

    const dataPoint: DebtProjectionData = {
      month,
      date: "",
      totalDebtWithInterest: 0,
      totalPaid: 0,
      totalForgiveness: 0,
    };

    if (shouldInclude) {
      dataPoint.date = currentMonth.toLocaleDateString("nl-NL", {
        year: "numeric",
      });
    }

    debts.forEach((debt) => {
      const startDate = new Date(debt.startDate);
      const endDate = debt.endDate ? new Date(debt.endDate) : null;

      if (month === 0) {
        // Starting point (today)
        dataPoint.totalDebtWithInterest! += debt.currentBalance;
        dataPoint.totalPaid = 0;
        dataPoint.totalForgiveness = 0;
      } else if (currentMonth < startDate) {
        // Before start date - no payments yet, debt stays same
        dataPoint.totalDebtWithInterest! += debt.currentBalance;
        // No payments yet
      } else if (month <= debtMaxMonths[debt.id]) {
        // After start date - calculate interest and payments
        const balanceNoPayment = balancesWithoutPayment[debt.id];
        const monthlyRate = debt.interestRate / 100 / 12;
        const interestNoPayment = balanceNoPayment * monthlyRate;
        const payment = debt.monthlyPayment || 0;

        // Calculate balance WITHOUT payments (only interest compounds)
        const newBalanceNoPayment = balanceNoPayment + interestNoPayment;
        balancesWithoutPayment[debt.id] = newBalanceNoPayment;

        // Track total paid
        totalPaidPerDebt[debt.id] += payment;

        // Add to totals
        dataPoint.totalDebtWithInterest! += newBalanceNoPayment;
        dataPoint.totalPaid! += totalPaidPerDebt[debt.id];
      } else {
        // After end date - debt is forgiven, no more interest accrues
        dataPoint.totalDebtWithInterest! += balancesWithoutPayment[debt.id];
        dataPoint.totalPaid! += totalPaidPerDebt[debt.id];
      }
    });

    // Calculate forgiveness: difference between what you'd owe (with interest) and what you paid
    dataPoint.totalForgiveness = Math.max(
      0,
      dataPoint.totalDebtWithInterest! - dataPoint.totalPaid!
    );

    // Only add yearly data points
    if (month === 0 || month === maxMonths || month % 12 === 0) {
      projectionData.push(dataPoint);
    }
  }

  return projectionData;
}

/**
 * Get consistent colors for debt lines
 */
function getColorForIndex(index: number): string {
  const colors = [
    "#ef4444", // red
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#10b981", // emerald
  ];
  return colors[index % colors.length];
}
