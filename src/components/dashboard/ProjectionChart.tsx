import { LineChart } from "@mui/x-charts/LineChart";
import type { BalanceProjection, Account } from "@/types/finance";
import { useEffect, useState, useMemo } from "react";
import { MonthlyBreakdown } from "./MonthlyBreakdown";

interface ProjectionChartProps {
  projections: BalanceProjection[];
  accounts: Account[];
  currentBalance?: number;
}

// Custom tooltip component using DaisyUI styling
function CustomTooltip(props: any) {
  const { axisData, series } = props;

  if (!axisData?.x?.value) return null;

  const date = new Date(axisData.x.value as number);
  const formattedDate = date.toLocaleDateString("nl-NL", {
    month: "long",
    year: "numeric",
  });

  const dataIndex = axisData.x?.index;
  if (dataIndex === undefined) return null;

  // Calculate month-over-month change for total balance
  const totalSeries = series.find((s: any) => s.label === "Totaal");
  let monthChange = 0;
  let monthChangePercent = 0;

  if (totalSeries && dataIndex > 0) {
    const currentValue = totalSeries.data[dataIndex];
    const previousValue = totalSeries.data[dataIndex - 1];
    if (currentValue !== null && previousValue !== null) {
      monthChange = currentValue - previousValue;
      monthChangePercent = (monthChange / previousValue) * 100;
    }
  }

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300 p-4 min-w-64">
      <div className="text-base font-bold text-base-content mb-3 border-b border-base-300 pb-2">
        {formattedDate}
      </div>

      {/* Account Balances */}
      <div className="space-y-2 mb-3">
        {series.map((s: any) => {
          if (!s.data || s.data.length === 0) return null;

          const value = s.data[dataIndex];
          if (value === null || value === undefined) return null;

          return (
            <div key={s.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm text-base-content">{s.label}</span>
              </div>
              <span className="text-sm font-mono font-semibold text-base-content">
                €
                {(value as number).toLocaleString("nl-NL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Month over Month Change */}
      {dataIndex > 0 && monthChange !== 0 && (
        <div className="pt-3 border-t border-base-300">
          <div className="flex items-center justify-between">
            <span className="text-sm text-base-content/70">
              Maandelijkse verandering:
            </span>
            <div className="text-right">
              <div
                className={`text-sm font-mono font-semibold ${
                  monthChange >= 0 ? "text-success" : "text-error"
                }`}
              >
                {monthChange >= 0 ? "+" : ""}€
                {monthChange.toLocaleString("nl-NL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div
                className={`text-xs ${
                  monthChange >= 0 ? "text-success" : "text-error"
                }`}
              >
                {monthChange >= 0 ? "+" : ""}
                {monthChangePercent.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hardcoded fallback colors that look good
const FALLBACK_COLORS = {
  primary: "#570df8", // DaisyUI default primary
  secondary: "#f000b8", // DaisyUI default secondary
  accent: "#37cdbe", // DaisyUI default accent
  neutral: "#3d4451", // DaisyUI default neutral
};

export function ProjectionChart({
  projections,
  accounts,
  currentBalance = 0,
}: ProjectionChartProps) {
  const [chartColors, setChartColors] = useState(FALLBACK_COLORS);

  // Try to get actual DaisyUI theme colors
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Create hidden elements to extract computed colors
    const extractColor = (className: string): string => {
      const temp = document.createElement("div");
      temp.className = className;
      temp.style.display = "none";
      document.body.appendChild(temp);
      const color = window.getComputedStyle(temp).backgroundColor;
      document.body.removeChild(temp);
      return color;
    };

    try {
      const primary = extractColor("bg-primary");
      const secondary = extractColor("bg-secondary");
      const accent = extractColor("bg-accent");
      const neutral = extractColor("bg-neutral");

      setChartColors({
        primary: primary || FALLBACK_COLORS.primary,
        secondary: secondary || FALLBACK_COLORS.secondary,
        accent: accent || FALLBACK_COLORS.accent,
        neutral: neutral || FALLBACK_COLORS.neutral,
      });
    } catch (error) {
      console.error("Failed to extract DaisyUI colors:", error);
    }
  }, []);

  if (projections.length === 0) return null;

  // Memoize series data to avoid recalculation on every render
  const series = useMemo(() => {
    const seriesData = [
      {
        data: projections.map((p) => p.totalBalance),
        label: "Totaal",
        color: chartColors.primary,
        valueFormatter: (value: number | null) => {
          if (value === null) return "N/A";
          return `€${value.toFixed(0)}`;
        },
      },
    ];

    // Add a series for each account with DaisyUI colors
    const accountColorKeys: (keyof typeof chartColors)[] = [
      "secondary",
      "accent",
      "neutral",
    ];

    accounts.forEach((account, index) => {
      const colorKey = accountColorKeys[index % accountColorKeys.length];
      seriesData.push({
        data: projections.map((p) => p.accountBalances?.[account.id] || 0),
        label: account.name,
        color: chartColors[colorKey],
        valueFormatter: (value: number | null) =>
          value !== null ? `€${value.toFixed(0)}` : "N/A",
      });
    });

    return seriesData;
  }, [projections, accounts, chartColors]);

  const chartData = {
    xAxis: [
      {
        data: projections.map((p) => new Date(p.date)),
        scaleType: "time" as const,
        valueFormatter: (date: Date) =>
          date.toLocaleDateString("nl-NL", { month: "short", year: "numeric" }),
      },
    ],
    yAxis: [
      {
        valueFormatter: (value: number) => `${Math.round(value / 1000)}k`,
      },
    ],
    series,
  };

  return (
    <div className="card bg-base-200 shadow p-4">
      <h3 className="text-xl font-bold mb-4">Balans Projectie</h3>
      <div style={{ width: "100%", height: "400px" }}>
        <LineChart
          xAxis={chartData.xAxis}
          yAxis={chartData.yAxis}
          series={chartData.series}
          margin={{ left: 70, right: 20, top: 20, bottom: 70 }}
          sx={{
            "& .MuiChartsAxis-tickLabel": {
              fill: "inherit",
            },
            "& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel": {
              transform: "translateY(10px) rotate(-45deg)",
              textAnchor: "end",
            },
            "& .MuiChartsAxis-tickLabel tspan": {
              overflow: "visible",
            },
          }}
        />
      </div>

      {/* Add the monthly breakdown table */}
      <div className="mt-6 pt-6 border-t border-base-300">
        <h4 className="text-lg font-semibold text-base-content mb-3">
          Toekomstige Maanden
        </h4>
        <MonthlyBreakdown
          projections={projections}
          currentBalance={currentBalance}
          accounts={accounts}
        />
      </div>
    </div>
  );
}
