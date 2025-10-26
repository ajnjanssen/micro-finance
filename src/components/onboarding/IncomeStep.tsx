import type { IncomeSource } from "@/types/financial-config";
import type { NavigationProps } from "./types";
import { useIncomeForm } from "./hooks/useIncomeForm";

interface IncomeStepProps extends NavigationProps {
  incomeSources: Omit<IncomeSource, "id">[];
  onAdd: (income: Omit<IncomeSource, "id">) => void;
  onRemove: (index: number) => void;
}

export function IncomeStep({
  incomeSources,
  onAdd,
  onRemove,
  onNext,
  onBack,
}: IncomeStepProps) {
  const { showForm, formData, setShowForm, setFormData, handleSubmit } =
    useIncomeForm(onAdd);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Configureer je inkomsten</h2>
        <p className="text-base-content/70">
          Voeg je salaris en andere terugkerende inkomsten toe
        </p>
      </div>

      {incomeSources.length > 0 && (
        <div className="space-y-2">
          {incomeSources.map((income, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg"
            >
              <div>
                <h4 className="font-semibold">{income.name}</h4>
                <p className="text-sm text-base-content/70 capitalize">
                  {income.frequency}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-success">
                  €{income.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => onRemove(index)}
                  className="btn btn-ghost btn-sm btn-circle text-error"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="card bg-base-200 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold">Nieuwe Inkomstenbron</h3>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input input-bordered w-full"
            placeholder="bijv. Salaris - Bedrijfsnaam"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="input input-bordered w-full"
              placeholder="2800.00"
              required
            />
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value as any })
              }
              className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
            >
              <option value="weekly">Wekelijks</option>
              <option value="biweekly">Tweewekelijks</option>
              <option value="monthly">Maandelijks</option>
              <option value="quarterly">Kwartaal</option>
              <option value="yearly">Jaarlijks</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost flex-1"
            >
              Annuleren
            </button>
            <button type="submit" className="btn btn-success flex-1">
              Toevoegen
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-outline btn-block"
        >
          + Inkomsten Toevoegen
        </button>
      )}

      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="btn btn-ghost">
          ← Terug
        </button>
        <button onClick={onNext} className="btn btn-primary">
          {incomeSources.length > 0 ? "Volgende: Uitgaven →" : "Overslaan →"}
        </button>
      </div>
    </div>
  );
}
