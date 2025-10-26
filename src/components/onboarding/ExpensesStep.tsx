import type { RecurringExpense } from "@/types/financial-config";
import type { NavigationProps } from "./types";
import { useExpenseForm } from "./hooks/useExpenseForm";
import { EXPENSE_CATEGORIES } from "./expense-categories";

interface ExpensesStepProps extends NavigationProps {
  expenses: Omit<RecurringExpense, "id">[];
  onAdd: (expense: Omit<RecurringExpense, "id">) => void;
  onRemove: (index: number) => void;
}

export function ExpensesStep({
  expenses,
  onAdd,
  onRemove,
  onNext,
  onBack,
}: ExpensesStepProps) {
  const { showForm, formData, setShowForm, setFormData, handleSubmit } =
    useExpenseForm(onAdd);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Voeg je vaste lasten toe</h2>
        <p className="text-base-content/70">
          Huur, verzekeringen, abonnementen, etc.
        </p>
      </div>

      {expenses.length > 0 && (
        <div className="space-y-2">
          {expenses.map((expense, index) => {
            const catInfo = EXPENSE_CATEGORIES.find(
              (c) => c.value === expense.category
            );
            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-error/10 border border-error/20 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{catInfo?.icon || "📝"}</span>
                  <div>
                    <h4 className="font-semibold">{expense.name}</h4>
                    <p className="text-sm text-base-content/70">
                      {catInfo?.label} · {expense.frequency}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-error">
                    €{expense.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onRemove(index)}
                    className="btn btn-ghost btn-sm btn-circle text-error"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="card bg-base-200 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold">Nieuwe Vaste Last</h3>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input input-bordered w-full"
            placeholder="bijv. Huur - Patrimonium"
            required
          />
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
            required
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="input input-bordered w-full"
              placeholder="727.33"
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
          <label className="label cursor-pointer">
            <span className="label-text">Essentiële uitgave</span>
            <input
              type="checkbox"
              checked={formData.isEssential}
              onChange={(e) =>
                setFormData({ ...formData, isEssential: e.target.checked })
              }
              className="checkbox checkbox-primary"
            />
          </label>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost flex-1"
            >
              Annuleren
            </button>
            <button type="submit" className="btn btn-error flex-1">
              Toevoegen
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-outline btn-block"
        >
          + Uitgave Toevoegen
        </button>
      )}

      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="btn btn-ghost">
          ← Terug
        </button>
        <button onClick={onNext} className="btn btn-primary">
          {expenses.length > 0 ? "Volgende: Voltooien →" : "Overslaan →"}
        </button>
      </div>
    </div>
  );
}
