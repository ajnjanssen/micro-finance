import type { IncomeSource } from "@/types/financial-config";
import { IncomeForm } from "./IncomeForm";

interface IncomeSectionProps {
  incomeSources: IncomeSource[];
  showForm: boolean;
  editingIncome: IncomeSource | null;
  onAdd: () => void;
  onEdit: (income: IncomeSource) => void;
  onSave: (data: Omit<IncomeSource, "id">) => Promise<void>;
  onCancel: () => void;
  onDelete: (id: string) => Promise<void>;
}

export function IncomeSection({
  incomeSources,
  showForm,
  editingIncome,
  onAdd,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: IncomeSectionProps) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">💵 Inkomstenbronnen</h2>
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            + Toevoegen
          </button>
        </div>

        {showForm && (
          <IncomeForm
            income={editingIncome}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}

        <div className="space-y-2">
          {incomeSources.length === 0 ? (
            <p className="text-center py-8 text-base-content/50">
              Nog geen inkomstenbronnen geconfigureerd. Klik op "Toevoegen" om
              te beginnen.
            </p>
          ) : (
            incomeSources.map((source) => (
              <div
                key={source.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  source.isActive ? "bg-base-200" : "bg-base-200/50 opacity-60"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{source.name}</h3>
                    {!source.isActive && (
                      <span className="badge ">Inactief</span>
                    )}
                  </div>
                  <p className="text-sm text-base-content/70">
                    €{source.amount.toFixed(2)}/
                    {source.frequency === "monthly"
                      ? "maand"
                      : source.frequency}
                    {source.dayOfMonth && ` • Dag ${source.dayOfMonth}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => onEdit(source)}
                  >
                    Bewerken
                  </button>
                  <button
                    className="btn btn-sm btn-ghost btn-error"
                    onClick={() => onDelete(source.id)}
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
