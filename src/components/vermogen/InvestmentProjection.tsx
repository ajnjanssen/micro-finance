"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import { useEffect, useState } from "react";
import type { InvestmentProjection as InvestmentProjectionPoint } from "@/types/finance";
import { formatCurrency } from "@/utils/formatters";

interface InvestmentProjectionData {
  accounts: {
    id: string;
    name: string;
    expectedAnnualReturn: number;
  }[];
  projections: InvestmentProjectionPoint[];
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function InvestmentProjection() {
  const [data, setData] = useState<InvestmentProjectionData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/finance/investment-projections?months=60")
      .then(async (response) => {
        const result = (await response.json()) as InvestmentProjectionData & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(
            result.error || "Beleggingsprognose kon niet worden geladen.",
          );
        }
        return result;
      })
      .then(setData)
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : "Beleggingsprognose kon niet worden geladen.",
        );
      });
  }, []);

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Beleggingsprognose</h2>
          <span className="loading loading-spinner loading-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Beleggingsprognose</h2>
        {data.accounts.length === 0 ? (
          <p className="text-sm text-base-content/70">
            Voeg bij Instellingen een rekening van het type Aandelen toe om
            rendement en toekomstige beleggingstransfers te projecteren.
          </p>
        ) : (
          <>
            <p className="text-sm text-base-content/70">
              Verwacht rendement wordt maandelijks samengesteld. Geplande
              transfers naar deze rekeningen worden na de maandelijkse groei
              verwerkt; dit is een schatting en geen garantie.
            </p>
            <div className="w-full overflow-x-auto">
              <LineChart
                xAxis={[
                  {
                    data: data.projections.map((projection) =>
                      parseLocalDate(projection.date),
                    ),
                    scaleType: "time",
                    valueFormatter: (date: Date) =>
                      date.toLocaleDateString("nl-NL", {
                        month: "short",
                        year: "numeric",
                      }),
                  },
                ]}
                yAxis={[
                  {
                    valueFormatter: (value: number) => formatCurrency(value),
                  },
                ]}
                series={data.accounts.map((account) => ({
                  data: data.projections.map(
                    (projection) => projection.accountBalances[account.id] ?? 0,
                  ),
                  label: `${account.name} (${account.expectedAnnualReturn}% p.j.)`,
                  valueFormatter: (value: number | null) =>
                    value === null ? "—" : formatCurrency(value),
                }))}
                height={360}
                margin={{ left: 90, right: 24, top: 24, bottom: 56 }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
