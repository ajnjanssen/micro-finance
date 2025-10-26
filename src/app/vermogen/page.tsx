"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/formatters";
import { DebtForm } from "@/components/vermogen/DebtForm";
import { AssetForm } from "@/components/vermogen/AssetForm";
import { DebtProjectionView } from "@/components/vermogen/DebtProjectionView";
import { DebtProjectionChart } from "@/components/vermogen/DebtProjectionChart";
import { PageLayout, PageHeader } from "@/components/PageLayout";
import type { NetWorthSummary, Asset, Debt } from "@/types/assets-liabilities";

export default function VermogenPage() {
  const [summary, setSummary] = useState<NetWorthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Debt | null>(null);
  const [viewingDebtProjection, setViewingDebtProjection] =
    useState<Debt | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("/api/net-worth");
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error loading net worth:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit activum wilt verwijderen?")) return;

    try {
      await fetch(`/api/assets?id=${id}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Error deleting asset:", error);
    }
  };

  const handleDeleteLiability = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze schuld wilt verwijderen?")) return;

    try {
      await fetch(`/api/liabilities?id=${id}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Error deleting liability:", error);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-base-300 rounded w-1/3" />
          <div className="h-32 bg-base-300 rounded" />
        </div>
      </PageLayout>
    );
  }

  if (!summary) {
    return (
      <PageLayout>
        <div className="alert alert-error">
          <span>Fout bij het laden van vermogensgegevens</span>
        </div>
      </PageLayout>
    );
  }

  const netWorthColor = summary.netWorth >= 0 ? "text-success" : "text-error";

  return (
    <PageLayout maxWidth="xl">
      <PageHeader title="Vermogen & Schulden" />

      {/* Net Worth Summary */}
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-title">Totaal Activa</div>
          <div className="stat-value text-success">
            {formatCurrency(summary.totalAssets)}
          </div>
          <div className="stat-desc">{summary.assets.length} items</div>
        </div>

        <div className="stat">
          <div className="stat-title">Totaal Passiva</div>
          <div className="stat-value text-error">
            {formatCurrency(summary.totalLiabilities)}
          </div>
          <div className="stat-desc">{summary.liabilities.length} schulden</div>
        </div>

        <div className="stat">
          <div className="stat-title">Netto Vermogen</div>
          <div className={`stat-value ${netWorthColor}`}>
            {formatCurrency(summary.netWorth)}
          </div>
          <div className="stat-desc">
            {summary.netWorth >= 0 ? "Positief saldo" : "Negatief saldo"}
          </div>
        </div>
      </div>

      {/* Debt Projection Chart */}
      {summary.liabilities.length > 0 && (
        <DebtProjectionChart debts={summary.liabilities} />
      )}

      {/* Assets Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Activa (Bezittingen)</h2>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddAsset(true)}
            >
              + Activum Toevoegen
            </button>
          </div>

          {summary.assets.length === 0 ? (
            <div className="text-center py-8 text-base-content/70">
              <p>Geen activa gevonden</p>
              <p className="text-sm">
                Voeg bezittingen toe zoals eigendommen, voertuigen of
                beleggingen
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Naam</th>
                    <th>Type</th>
                    <th className="text-right">Huidige Waarde</th>
                    <th className="text-right">Aankoopprijs</th>
                    <th className="text-right">Winst/Verlies</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {summary.assets.map((asset) => {
                    const gainLoss = asset.purchasePrice
                      ? asset.currentValue - asset.purchasePrice
                      : 0;
                    const gainLossPercent = asset.purchasePrice
                      ? ((gainLoss / asset.purchasePrice) * 100).toFixed(1)
                      : null;

                    return (
                      <tr key={asset.id}>
                        <td>
                          <div>
                            <div className="font-semibold">{asset.name}</div>
                            {asset.description && (
                              <div className="text-sm text-base-content/70">
                                {asset.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-ghost">
                            {getAssetTypeLabel(asset.type)}
                          </span>
                        </td>
                        <td className="text-right font-mono font-semibold">
                          {formatCurrency(asset.currentValue)}
                        </td>
                        <td className="text-right font-mono text-base-content/70">
                          {asset.purchasePrice
                            ? formatCurrency(asset.purchasePrice)
                            : "-"}
                        </td>
                        <td className="text-right">
                          {gainLoss !== 0 && (
                            <span
                              className={`badge ${
                                gainLoss > 0 ? "badge-success" : "badge-error"
                              }`}
                            >
                              {gainLoss > 0 ? "+" : ""}
                              {formatCurrency(gainLoss)}
                              {gainLossPercent && ` (${gainLossPercent}%)`}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => setEditingAsset(asset)}
                              title="Bewerken"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleDeleteAsset(asset.id)}
                              title="Verwijderen"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Liabilities Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Passiva (Schulden)</h2>
            <button
              className="btn btn-error btn-sm"
              onClick={() => setShowAddLiability(true)}
            >
              + Schuld Toevoegen
            </button>
          </div>

          {summary.liabilities.length === 0 ? (
            <div className="text-center py-8 text-base-content/70">
              <p>Geen schulden gevonden</p>
              <p className="text-sm">
                Voeg schulden toe zoals studieleningen, hypotheken of
                creditcards
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Naam</th>
                    <th>Type</th>
                    <th className="text-right">Huidig Saldo</th>
                    <th className="text-right">Oorspronkelijk</th>
                    <th className="text-right">Rente</th>
                    <th className="text-right">Maandelijkse Betaling</th>
                    <th className="text-center">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.liabilities.map((debt) => {
                    const paidOff = debt.originalAmount - debt.currentBalance;
                    const percentPaid = (
                      (paidOff / debt.originalAmount) *
                      100
                    ).toFixed(1);

                    return (
                      <tr key={debt.id}>
                        <td>
                          <div>
                            <div className="font-semibold">{debt.name}</div>
                            {debt.description && (
                              <div className="text-sm text-base-content/70">
                                {debt.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-ghost">
                            {getDebtTypeLabel(debt.type)}
                          </span>
                        </td>
                        <td className="text-right font-mono font-semibold">
                          {formatCurrency(debt.currentBalance)}
                        </td>
                        <td className="text-right font-mono text-base-content/70">
                          {formatCurrency(debt.originalAmount)}
                        </td>
                        <td className="text-right">{debt.interestRate}%</td>
                        <td className="text-right font-mono">
                          {debt.monthlyPayment
                            ? formatCurrency(debt.monthlyPayment)
                            : "-"}
                        </td>
                        <td>
                          <div className="flex gap-2 justify-center">
                            {debt.monthlyPayment && debt.monthlyPayment > 0 && (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => setViewingDebtProjection(debt)}
                                title="Bekijk Aflossingsschema"
                              >
                                📊
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => setEditingLiability(debt)}
                              title="Bewerken"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleDeleteLiability(debt.id)}
                              title="Verwijderen"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
      {showAddAsset && (
        <AssetForm onClose={() => setShowAddAsset(false)} onSave={loadData} />
      )}

      {editingAsset && (
        <AssetForm
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSave={loadData}
        />
      )}

      {showAddLiability && (
        <DebtForm
          onClose={() => setShowAddLiability(false)}
          onSave={loadData}
        />
      )}

      {editingLiability && (
        <DebtForm
          debt={editingLiability}
          onClose={() => setEditingLiability(null)}
          onSave={loadData}
        />
      )}

      {viewingDebtProjection && (
        <DebtProjectionView
          debt={viewingDebtProjection}
          onClose={() => setViewingDebtProjection(null)}
        />
      )}
    </PageLayout>
  );
}

function getAssetTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    property: "Eigendom",
    vehicle: "Voertuig",
    investment: "Belegging",
    savings: "Spaargeld",
    crypto: "Crypto",
    other: "Anders",
  };
  return labels[type] || type;
}

function getDebtTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    "student-loan": "Studielening",
    mortgage: "Hypotheek",
    "credit-card": "Creditcard",
    "personal-loan": "Persoonlijke Lening",
    "car-loan": "Autolening",
    other: "Anders",
  };
  return labels[type] || type;
}
