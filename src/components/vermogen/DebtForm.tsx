"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/formatters";
import type { Debt, DebtType } from "@/types/assets-liabilities";

interface DebtFormProps {
  debt?: Debt | null;
  onClose: () => void;
  onSave: () => void;
}

const DEBT_TYPES: { value: DebtType; label: string }[] = [
  { value: "student-loan", label: "Studielening" },
  { value: "mortgage", label: "Hypotheek" },
  { value: "credit-card", label: "Creditcard" },
  { value: "personal-loan", label: "Persoonlijke Lening" },
  { value: "car-loan", label: "Autolening" },
  { value: "other", label: "Anders" },
];

export function DebtForm({ debt, onClose, onSave }: DebtFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "student-loan" as DebtType,
    description: "",
    originalAmount: 0,
    currentBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isActive: true,
    creditor: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (debt) {
      setFormData({
        name: debt.name,
        type: debt.type,
        description: debt.description || "",
        originalAmount: debt.originalAmount,
        currentBalance: debt.currentBalance,
        interestRate: debt.interestRate,
        monthlyPayment: debt.monthlyPayment || 0,
        startDate: debt.startDate,
        endDate: debt.endDate || "",
        isActive: debt.isActive,
        creditor: debt.creditor || "",
        notes: debt.notes || "",
      });
    }
  }, [debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = "/api/liabilities";
      const method = debt ? "PUT" : "POST";
      const body = debt ? { id: debt.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to save debt");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const calculatePayoffDate = () => {
    if (formData.monthlyPayment <= 0 || formData.currentBalance <= 0) return "";

    const monthlyRate = formData.interestRate / 100 / 12;
    let balance = formData.currentBalance;
    let months = 0;

    // Simple amortization calculation
    while (balance > 0 && months < 1200) {
      // Cap at 100 years
      const interest = balance * monthlyRate;
      const principal = formData.monthlyPayment - interest;
      if (principal <= 0) return "Betaling te laag voor rente";
      balance -= principal;
      months++;
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);
    return payoffDate.toISOString().split("T")[0];
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">
          {debt ? "Schuld Bewerken" : "Nieuwe Schuld"}
        </h3>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Naam *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Type *</span>
              </label>
              <select
                className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as DebtType })
                }
                required
              >
                {DEBT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Beschrijving</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Financial Details */}
          <div className="divider">Financiële Details</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Oorspronkelijk Bedrag (€) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={formData.originalAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    originalAmount: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Huidig Saldo (€) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={formData.currentBalance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentBalance: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Rente (% per jaar) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={formData.interestRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interestRate: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Maandelijkse Betaling (€)</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={formData.monthlyPayment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthlyPayment: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <label className="label">
                <span className="label-text-alt text-warning">
                  Optioneel - laat leeg als schuld wordt kwijtgescholden
                </span>
              </label>
            </div>
          </div>

          {/* Dates */}
          <div className="divider">Datums</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Startdatum *</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Aflosdatum (optioneel)</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
              <label className="label">
                <span className="label-text-alt">
                  Datum waarop schuld afgelost/kwijtgescholden wordt
                </span>
              </label>
            </div>
          </div>

          {formData.monthlyPayment > 0 && formData.currentBalance > 0 && (
            <div className="alert alert-info">
              <div>
                <div className="font-semibold">Berekende Aflosdatum</div>
                <div className="text-sm">{calculatePayoffDate()}</div>
              </div>
            </div>
          )}

          {formData.endDate && formData.monthlyPayment > 0 && (
            <div className="alert alert-warning">
              <div>
                <div className="font-semibold">⚠️ Kwijtschelding</div>
                <div className="text-sm">
                  Als de schuld niet volledig is afbetaald op{" "}
                  {new Date(formData.endDate).toLocaleDateString("nl-NL")},
                  wordt het resterende bedrag kwijtgescholden (bijv. DUO
                  regeling).
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="divider">Extra Informatie</div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Schuldeiser</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={formData.creditor}
              onChange={(e) =>
                setFormData({ ...formData, creditor: e.target.value })
              }
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Notities</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              <span className="label-text">Actief</span>
            </label>
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : debt ? (
                "Opslaan"
              ) : (
                "Toevoegen"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
