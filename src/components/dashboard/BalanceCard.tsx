import { useState } from "react";
import type { Account } from "@/types/finance";
import { formatCurrency } from "@/utils/formatters";

interface BalanceCardProps {
  currentBalance: number;
  accounts: Account[];
  accountBalances: Record<string, number>;
  onBalanceUpdate: () => Promise<void>;
}

export function BalanceCard({
  currentBalance,
  accounts,
  accountBalances,
  onBalanceUpdate,
}: BalanceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(currentBalance.toString());
  const [saveError, setSaveError] = useState("");
  const accountBreakdown: {
    checking: number;
    savings: number;
    other: number;
  } = { checking: 0, savings: 0, other: 0 };
  for (const account of accounts) {
    const balance = accountBalances[account.id] || 0;
    if (account.type === "checking") accountBreakdown.checking += balance;
    else if (account.type === "savings") accountBreakdown.savings += balance;
    else accountBreakdown.other += balance;
  }
  const primaryChecking = accounts.find(
    (account) => account.type === "checking",
  );
  const checkingBalance = primaryChecking
    ? accountBalances[primaryChecking.id] || 0
    : 0;

  const handleSave = async () => {
    try {
      if (!edited.trim()) {
        setSaveError("Voer een geldig saldo in.");
        return;
      }
      const newBalance = Number(edited);
      if (!Number.isFinite(newBalance)) {
        setSaveError("Voer een geldig saldo in.");
        return;
      }

      const response = await fetch("/api/settings/update-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newBalance, accountId: primaryChecking?.id }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Saldo bijwerken is mislukt.");
      }

      setSaveError("");
      setIsEditing(false);
      await onBalanceUpdate();
    } catch (error) {
      console.error("Error updating balance:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Fout bij het bijwerken van het saldo.",
      );
    }
  };

  return (
    <div className="card bg-base-100 shadow border border-primary">
      <div className="card-body">
        <h3 className="card-title text-base flex items-center gap-2">
          💰 Totaal saldo (rekeningen)
        </h3>
        {isEditing ? (
          <div className="flex flex-col gap-3 mt-2">
            <input
              type="number"
              step="0.01"
              value={edited}
              onChange={(e) => setEdited(e.target.value)}
              className="input input-bordered text-2xl font-bold w-full"
              aria-label="Saldo hoofdrekening"
            />
            <p className="text-sm text-base-content/70">
              Dit werkt het saldo van je lopende hoofdrekening bij. Je
              spaarrekeningen blijven ongewijzigd.
            </p>
            {saveError && (
              <p role="alert" className="text-sm text-error">
                {saveError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary btn-sm"
              >
                Opslaan
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-ghost btn-sm"
              >
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-success">
                {formatCurrency(currentBalance)}
              </div>
              <button
                type="button"
                onClick={() => {
                  setEdited(checkingBalance.toString());
                  setSaveError("");
                  setIsEditing(true);
                }}
                className="btn btn-ghost btn-sm"
                title="Saldo hoofdrekening bewerken"
              >
                ✏️
              </button>
            </div>

            {/* Account Type Breakdown */}
            <div className="divider my-2"></div>
            <div className="space-y-2 text-sm">
              {accountBreakdown.checking > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-base-content/70 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Lopend
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(accountBreakdown.checking)}
                  </span>
                </div>
              )}
              {accountBreakdown.savings > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-base-content/70 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    Sparen
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(accountBreakdown.savings)}
                  </span>
                </div>
              )}
              {accountBreakdown.other > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-base-content/70 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Overig
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(accountBreakdown.other)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
