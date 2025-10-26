import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/formatters";

interface BalanceCardProps {
  currentBalance: number;
  onBalanceUpdate: () => void;
}

export function BalanceCard({
  currentBalance,
  onBalanceUpdate,
}: BalanceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(currentBalance.toString());
  const [accountBreakdown, setAccountBreakdown] = useState<{
    checking: number;
    savings: number;
    other: number;
  }>({ checking: 0, savings: 0, other: 0 });

  useEffect(() => {
    loadAccountBreakdown();
  }, [currentBalance]);

  const loadAccountBreakdown = async () => {
    try {
      const response = await fetch("/api/finance");
      const data = await response.json();

      const breakdown = { checking: 0, savings: 0, other: 0 };

      // Calculate balances per account type
      data.accounts.forEach((account: any) => {
        let balance = account.startingBalance || 0;

        // Add completed transactions
        data.transactions
          .filter((tx: any) => tx.completed && tx.accountId === account.id)
          .forEach((tx: any) => {
            balance += tx.amount;
          });

        if (account.type === "checking") {
          breakdown.checking += balance;
        } else if (account.type === "savings") {
          breakdown.savings += balance;
        } else {
          breakdown.other += balance;
        }
      });

      setAccountBreakdown(breakdown);
    } catch (error) {
      console.error("Error loading account breakdown:", error);
    }
  };

  const handleSave = async () => {
    try {
      await fetch("/api/settings/update-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: parseFloat(edited) }),
      });
      setIsEditing(false);
      onBalanceUpdate();
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };

  return (
    <div className="card bg-base-100 shadow border border-primary">
      <div className="card-body">
        <h3 className="card-title text-base flex items-center gap-2">
          💰 Huidig Saldo (Rekeningen)
        </h3>
        {isEditing ? (
          <div className="flex flex-col gap-3 mt-2">
            <input
              type="number"
              step="0.01"
              value={edited}
              onChange={(e) => setEdited(e.target.value)}
              className="input input-bordered text-2xl font-bold w-full"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="btn btn-primary btn-sm">
                Opslaan
              </button>
              <button
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
                onClick={() => setIsEditing(true)}
                className="btn btn-ghost btn-sm"
                title="Saldo bewerken"
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
