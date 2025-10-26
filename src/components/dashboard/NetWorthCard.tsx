"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import Link from "next/link";
import type { NetWorthSummary } from "@/types/assets-liabilities";

export function NetWorthCard() {
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNetWorth();
  }, []);

  const loadNetWorth = async () => {
    try {
      const response = await fetch("/api/net-worth");
      const data = await response.json();
      setNetWorth(data);
    } catch (error) {
      console.error("Error loading net worth:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-base-300 rounded w-1/3" />
            <div className="h-8 bg-base-300 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!netWorth) return null;

  const netWorthColor =
    netWorth.netWorth >= 0 ? "badge badge-success" : "badge badge-error";

  return (
    <Link href="/vermogen">
      <div className="card bg-secondary shadow hover:shadow-lg transition-shadow cursor-pointer text-secondary-content">
        <div className="card-body">
          <h3 className="card-title text-secondary-content flex items-center gap-2">
            💎 Netto Vermogen
          </h3>

          <div className={`text-3xl font-bold p-6 ${netWorthColor}`}>
            {formatCurrency(netWorth.netWorth)}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <div className="text-secondary-content">Activa</div>
              <div className="font-semibold text-success-content badge badge-success">
                {formatCurrency(netWorth.totalAssets)}
              </div>
            </div>
            <div>
              <div className="text-secondary-content">Passiva</div>
              <div className="font-semibold badge badge-error">
                {formatCurrency(netWorth.totalLiabilities)}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-secondary-content">
            {netWorth.assets.length} activa • {netWorth.liabilities.length}{" "}
            schulden
          </div>

          <div className="card-actions justify-end mt-2">
            <span className="text-sm text-secondary-content">
              Bekijk details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
