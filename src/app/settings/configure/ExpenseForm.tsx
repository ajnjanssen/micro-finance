import { useState } from "react";
import type { RecurringExpense, Frequency } from "@/types/financial-config";

interface ExpenseFormProps {
  expense: RecurringExpense | null;
  onSave: (data: Omit<RecurringExpense, "id">) => void;
  onCancel: () => void;
}

export function ExpenseForm({ expense, onSave, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState<Omit<RecurringExpense, "id">>({
    name: expense?.name || "",
    category: expense?.category || "uncategorized",
    amount: expense?.amount || 0,
    frequency: expense?.frequency || "monthly",
    dayOfMonth: expense?.dayOfMonth,
    startDate: expense?.startDate || new Date().toISOString().split("T")[0],
    endDate: expense?.endDate,
    isActive: expense?.isActive ?? true,
    isEssential: expense?.isEssential ?? false,
    isVariable: expense?.isVariable ?? false,
    estimatedVariance: expense?.estimatedVariance,
    notes: expense?.notes,
  });

  return (
    <div className="card bg-base-300 p-4 mb-4">
      <h3 className="font-bold mb-4">
        {expense ? "Bewerk" : "Nieuwe"} Uitgave
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Naam</span>
          </label>
          <input
            type="text"
            placeholder="Bijv. Huur - Patrimonium"
            className="input input-bordered"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Categorie</span>
          </label>
          <input
            type="text"
            placeholder="Bijv. rent, groceries, utilities"
            className="input input-bordered"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Bedrag (€)</span>
          </label>
          <input
            type="number"
            step="0.01"
            className="input input-bordered"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Frequentie</span>
          </label>
          <select
            className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
            value={formData.frequency}
            onChange={(e) =>
              setFormData({
                ...formData,
                frequency: e.target.value as Frequency,
              })
            }
          >
            <option value="weekly">Wekelijks</option>
            <option value="biweekly">Tweewekelijks</option>
            <option value="monthly">Maandelijks</option>
            <option value="quarterly">Kwartaal</option>
            <option value="yearly">Jaarlijks</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Dag van de maand (optioneel)</span>
          </label>
          <input
            type="number"
            min="1"
            max="31"
            className="input input-bordered"
            value={formData.dayOfMonth || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                dayOfMonth: e.target.value
                  ? Number.parseInt(e.target.value)
                  : undefined,
              })
            }
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Startdatum</span>
          </label>
          <input
            type="date"
            className="input input-bordered"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
          />
        </div>

        <div className="form-control md:col-span-2">
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

        <div className="form-control md:col-span-2">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-error"
              checked={formData.isEssential}
              onChange={(e) =>
                setFormData({ ...formData, isEssential: e.target.checked })
              }
            />
            <span className="label-text">
              Essentieel (kan niet verminderen)
            </span>
          </label>
        </div>

        <div className="form-control md:col-span-2">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-warning"
              checked={formData.isVariable}
              onChange={(e) =>
                setFormData({ ...formData, isVariable: e.target.checked })
              }
            />
            <span className="label-text">Variabel bedrag</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onSave(formData)}
        >
          Opslaan
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Annuleren
        </button>
      </div>
    </div>
  );
}
