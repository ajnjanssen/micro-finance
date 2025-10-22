"use client";

import { useState } from "react";
import { Account } from "@/types/finance";

interface AccountFormProps {
  onSubmit: (account: Omit<Account, "id">) => Promise<void>;
  onCancel: () => void;
}

export default function AccountForm({ onSubmit, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "checking" as Account["type"],
    startingBalance: "",
    startDate: new Date().toISOString().split("T")[0], // Today's date
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const account: Omit<Account, "id"> = {
        name: formData.name,
        type: formData.type,
        startingBalance: parseFloat(formData.startingBalance) || 0,
        startDate: formData.startDate,
        description: formData.description || undefined,
      };

      await onSubmit(account);

      // Reset form
      setFormData({
        name: "",
        type: "checking",
        startingBalance: "",
        startDate: new Date().toISOString().split("T")[0],
        description: "",
      });
    } catch (error) {
      console.error("Error submitting account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountTypes = [
    { value: "checking", label: "Lopende rekening" },
    { value: "savings", label: "Spaarrekening" },
    { value: "crypto", label: "Crypto" },
    { value: "stocks", label: "Aandelen" },
    { value: "debt", label: "Schuld" },
    { value: "other", label: "Overig" },
  ];

  return (
    <div className="card bg-base-100 p-6">
      <h3 className="text-lg font-semibold mb-4 text-primary">
        Nieuwe Rekening
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-text">Rekening Naam</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input input-bordered w-full"
            placeholder="Bijvoorbeeld: ING Lopende rekening"
            required
          />
        </div>

        <div>
          <label className="label-text">Type Rekening</label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as Account["type"],
              })
            }
            className="input input-bordered w-full"
            required
          >
            {accountTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Huidig Saldo (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.startingBalance}
              onChange={(e) =>
                setFormData({ ...formData, startingBalance: e.target.value })
              }
              className="input input-bordered w-full"
              placeholder="0.00"
              required
            />
            <label className="label-text-alt text-info">
              Dit is je handmatig ingestelde saldo
            </label>
          </div>

          <div>
            <label className="label-text">Start Datum</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="input input-bordered w-full"
              required
            />
            <label className="label-text-alt text-info">
              Vanaf welke datum track je dit account?
            </label>
          </div>
        </div>

        <div>
          <label className="label-text">Beschrijving (optioneel)</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="textarea textarea-bordered w-full"
            placeholder="Extra informatie over deze rekening"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? "Toevoegen..." : "Rekening Toevoegen"}
          </button>
        </div>
      </form>
    </div>
  );
}
