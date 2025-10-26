"use client";

import { useState, useEffect } from "react";
import type { Asset, AssetType } from "@/types/assets-liabilities";

interface AssetFormProps {
  asset?: Asset | null;
  onClose: () => void;
  onSave: () => void;
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "property", label: "Eigendom" },
  { value: "vehicle", label: "Voertuig" },
  { value: "investment", label: "Belegging" },
  { value: "savings", label: "Spaargeld" },
  { value: "crypto", label: "Crypto" },
  { value: "other", label: "Anders" },
];

export function AssetForm({ asset, onClose, onSave }: AssetFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "savings" as AssetType,
    description: "",
    currentValue: 0,
    purchasePrice: 0,
    purchaseDate: "",
    appreciationRate: 0,
    depreciationRate: 0,
    isActive: true,
    location: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        type: asset.type,
        description: asset.description || "",
        currentValue: asset.currentValue,
        purchasePrice: asset.purchasePrice || 0,
        purchaseDate: asset.purchaseDate || "",
        appreciationRate: asset.appreciationRate || 0,
        depreciationRate: asset.depreciationRate || 0,
        isActive: asset.isActive,
        location: asset.location || "",
        notes: asset.notes || "",
      });
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = "/api/assets";
      const method = asset ? "PUT" : "POST";
      const body = asset ? { id: asset.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to save asset");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">
          {asset ? "Activum Bewerken" : "Nieuw Activum"}
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
                  setFormData({
                    ...formData,
                    type: e.target.value as AssetType,
                  })
                }
                required
              >
                {ASSET_TYPES.map((type) => (
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

          {/* Valuation */}
          <div className="divider">Waardering</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Huidige Waarde (€) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={formData.currentValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentValue: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Aankoopprijs (€)</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchasePrice: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Aankoopdatum</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData({ ...formData, purchaseDate: e.target.value })
              }
            />
          </div>

          {/* Growth/Depreciation */}
          <div className="divider">Waardeontwikkeling</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  Waardevermeerdering (% per jaar)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={formData.appreciationRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    appreciationRate: parseFloat(e.target.value) || 0,
                    depreciationRate: 0, // Clear depreciation if appreciation is set
                  })
                }
              />
              <label className="label">
                <span className="label-text-alt">
                  Voor eigendommen/beleggingen
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  Waardevermindering (% per jaar)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={formData.depreciationRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    depreciationRate: parseFloat(e.target.value) || 0,
                    appreciationRate: 0, // Clear appreciation if depreciation is set
                  })
                }
              />
              <label className="label">
                <span className="label-text-alt">Voor voertuigen</span>
              </label>
            </div>
          </div>

          {/* Additional Info */}
          <div className="divider">Extra Informatie</div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Locatie</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="bijv. Amsterdam, Binance, etc."
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
              ) : asset ? (
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
