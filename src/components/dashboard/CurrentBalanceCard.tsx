"use client";

import { useState } from "react";

interface CurrentBalanceCardProps {
  currentBalance: number;
  formatCurrency: (amount: number) => string;
}

export default function CurrentBalanceCard({
  currentBalance,
  formatCurrency,
}: CurrentBalanceCardProps) {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editedBalance, setEditedBalance] = useState(currentBalance.toString());

  const handleBalanceEdit = () => {
    setIsEditingBalance(true);
  };

  const handleBalanceSave = async () => {
    try {
      const newBalance = parseFloat(editedBalance);
      if (isNaN(newBalance)) {
        alert("Voer een geldig bedrag in");
        return;
      }

      const response = await fetch("/api/settings/update-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newBalance }),
      });

      if (!response.ok) {
        throw new Error("Failed to update balance");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error updating balance:", error);
      alert("Fout bij het bijwerken van het saldo");
    }
  };

  const handleBalanceCancel = () => {
    setEditedBalance(currentBalance.toString());
    setIsEditingBalance(false);
  };

  return (
    <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-lg font-medium text-base-content/70">
            Huidig Totaal Vermogen
          </h2>
          <div className="tooltip tooltip-right" data-tip="Dit is de som van alle rekeningen (betaalrekening + spaarrekening). Dit bedrag staat nu daadwerkelijk op je rekeningen.">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        {isEditingBalance ? (
          <div className="flex flex-col items-center gap-3">
            <input
              type="number"
              step="0.01"
              value={editedBalance}
              onChange={(e) => setEditedBalance(e.target.value)}
              className="input input-bordered input-lg text-center text-3xl font-bold w-64"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleBalanceSave}
                className="btn btn-primary btn-sm"
              >
                Opslaan
              </button>
              <button
                onClick={handleBalanceCancel}
                className="btn btn-ghost btn-sm"
              >
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-5xl font-bold text-primary mb-1">
              {formatCurrency(currentBalance)}
            </p>
            <button
              onClick={handleBalanceEdit}
              className="btn btn-ghost btn-sm mt-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Bewerken
            </button>
          </>
        )}
        <div className="mt-4 p-3 bg-base-200 rounded-lg">
          <p className="text-sm text-base-content/70">
            <strong>Wat is dit?</strong> Dit is het totale saldo van al je rekeningen samen (betaalrekening + spaarrekening), ZONDER rekening te houden met toekomstige uitgaven.
          </p>
        </div>
      </div>
    </div>
  );
}
