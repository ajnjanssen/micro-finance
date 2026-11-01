import { useState, useEffect } from "react";
import type { SavingsGoal } from "@/types/savings-goals";
import type { Transaction, Account } from "@/types/finance-v2";

interface GoalFormProps {
  editingGoal: SavingsGoal | null;
  defaultMonthlySavings: number;
  monthlyIncome?: number;
  monthlyEssentialExpenses?: number;
  transactions?: Transaction[];
  accounts?: Account[];
  onSubmit: (goal: any) => Promise<void>;
  onCancel: () => void;
}

function getLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getProjectedCompletionDate(
  startDate: string,
  currentAmount: number,
  targetAmount: number,
  monthlyContribution: number
): string | null {
  if (!startDate || targetAmount <= 0 || monthlyContribution <= 0) return null;

  const monthsToTarget = Math.ceil(
    Math.max(0, targetAmount - currentAmount) / monthlyContribution
  );
  const projectedDate = new Date(`${startDate}T12:00:00`);
  projectedDate.setDate(1);
  projectedDate.setMonth(
    projectedDate.getMonth() + Math.max(0, monthsToTarget - 1)
  );

  return projectedDate.toLocaleDateString("nl-NL", {
    month: "long",
    year: "numeric",
  });
}

export function GoalForm({
  editingGoal,
  defaultMonthlySavings,
  monthlyIncome = 2995.86,
  monthlyEssentialExpenses = 1423.4,
  transactions = [],
  accounts = [],
  onSubmit,
  onCancel,
}: GoalFormProps) {
  // Calculate initial values for editing
  const initialEmergencyMonths =
    editingGoal?.targetAmount && editingGoal.budgetType === "needs"
      ? Math.round(editingGoal.targetAmount / monthlyEssentialExpenses)
      : 6;

  const initialSavingsPercentage =
    editingGoal?.monthlyContribution && editingGoal.budgetType === "savings"
      ? Math.round((editingGoal.monthlyContribution / monthlyIncome) * 100)
      : 10;

  const [formData, setFormData] = useState({
    name: editingGoal?.name || "",
    targetAmount: editingGoal?.targetAmount || 0,
    currentAmount: editingGoal?.currentAmount || 0,
    monthlyContribution:
      editingGoal?.monthlyContribution || defaultMonthlySavings,
    priority: editingGoal?.priority || ("medium" as const),
    budgetType: editingGoal?.budgetType || ("wants" as const),
    emergencyMonths: initialEmergencyMonths,
    savingsPercentage: initialSavingsPercentage,
    fromAccountId: editingGoal?.fromAccountId || "",
    toAccountId: editingGoal?.toAccountId || "",
    startDate: editingGoal?.startDate || getLocalDateInputValue(),
  });

  // Auto-select default accounts if not editing and accounts are available
  useEffect(() => {
    if (!editingGoal && accounts.length > 0 && !formData.fromAccountId && !formData.toAccountId) {
      const checkingAccount = accounts.find((acc) => acc.type === "checking");
      const savingsAccount = accounts.find((acc) => acc.type === "savings");
      
      if (checkingAccount || savingsAccount) {
        setFormData((prev) => ({
          ...prev,
          fromAccountId: checkingAccount?.id || accounts[0]?.id || "",
          toAccountId: savingsAccount?.id || accounts[accounts.length > 1 ? 1 : 0]?.id || "",
        }));
      }
    }
  }, [editingGoal, accounts, formData.fromAccountId, formData.toAccountId]);

  const isEmergencyFund =
    formData.budgetType === "needs" &&
    formData.name.toLowerCase().includes("emergency");

  // Auto-calculate target amount for emergency fund
  useEffect(() => {
    if (
      formData.budgetType === "needs" &&
      formData.name.toLowerCase().includes("nood")
    ) {
      const emergencyTarget =
        monthlyEssentialExpenses * formData.emergencyMonths;
      setFormData((prev) => ({ ...prev, targetAmount: emergencyTarget }));
    }
  }, [
    formData.budgetType,
    formData.name,
    formData.emergencyMonths,
    monthlyEssentialExpenses,
  ]);

  // Auto-calculate monthly contribution for savings percentage
  useEffect(() => {
    if (formData.budgetType === "savings") {
      const monthlyAmount = (monthlyIncome * formData.savingsPercentage) / 100;
      setFormData((prev) => ({ ...prev, monthlyContribution: monthlyAmount }));
    }
  }, [formData.budgetType, formData.savingsPercentage, monthlyIncome]);

  const projectedCompletionDate = getProjectedCompletionDate(
    formData.startDate,
    formData.currentAmount,
    formData.targetAmount,
    formData.monthlyContribution
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { emergencyMonths, savingsPercentage, ...submitData } = formData;
    await onSubmit(submitData);
  };

  return (
    <div className="card bg-base-200 p-6">
      <h3 className="text-lg font-bold mb-4">
        {editingGoal ? "Doel Bewerken" : "Nieuw Spaardoel"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type First */}
        <div>
          <label className="label-text font-semibold">Type Doel</label>
          <select
            value={formData.budgetType}
            onChange={(e) => {
              const newType = e.target.value as any;
              setFormData({
                ...formData,
                budgetType: newType,
                // Set smart defaults based on type
                name: newType === "needs" ? "Noodfonds" : formData.name,
                priority: newType === "needs" ? "high" : formData.priority,
                currentAmount: 0, // Don't ask for current amount initially
              });
            }}
            className="select w-full select-bordered"
          >
            <option value="needs">🛡️ Noodfonds (Essentieel)</option>
            <option value="savings">💰 Algemeen Sparen</option>
            <option value="wants">🎯 Specifieke Aankoop</option>
          </select>
          <p className="text-sm text-base-content/60 mt-1">
            {formData.budgetType === "needs" &&
              "Voor essentiële zekerheid zoals een noodfonds"}
            {formData.budgetType === "savings" &&
              "Voor lange termijn doelen en algemene besparingen"}
            {formData.budgetType === "wants" && "Voor leuke aankopen en wensen"}
          </p>
        </div>

        <div>
          <label className="label-text">Naam</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input input-bordered w-full"
            placeholder={
              formData.budgetType === "needs"
                ? "Noodfonds"
                : formData.budgetType === "savings"
                ? "Jouw spaardoel"
                : "KTM Motor"
            }
            required
          />
        </div>

        <div>
          <label className="label-text" htmlFor="goal-start-date">
            Vanaf wanneer wil je beginnen met sparen?
          </label>
          <input
            id="goal-start-date"
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            className="input input-bordered w-full mt-1"
            required
          />
          <p className="text-sm text-base-content/60 mt-1">
            De planning neemt de eerste maandelijkse bijdrage mee vanaf deze
            maand.
          </p>
        </div>

        {/* Emergency Fund: Ask for months instead of amount */}
        {formData.budgetType === "needs" &&
        formData.name.toLowerCase().includes("nood") ? (
          <div>
            <label className="label-text">Hoeveel maanden uitgaven?</label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.emergencyMonths}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emergencyMonths: parseInt(e.target.value),
                })
              }
              className="input input-bordered w-full"
              required
            />
            <p className="text-sm text-base-content/60 mt-1">
              Streefbedrag: €
              {(monthlyEssentialExpenses * formData.emergencyMonths).toFixed(2)}
              <span className="ml-2">
                ({formData.emergencyMonths} maanden × €
                {monthlyEssentialExpenses.toFixed(2)})
              </span>
            </p>
          </div>
        ) : formData.budgetType === "savings" ? (
          /* Savings: Ask for percentage of income with slider */
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="label">
                <span className="label-text font-medium">
                  Hoeveel per maand sparen?
                </span>
                <span className="label-text-alt text-primary font-semibold">
                  €
                  {((monthlyIncome * formData.savingsPercentage) / 100).toFixed(
                    0
                  )}
                  /mnd
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={formData.savingsPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    savingsPercentage: parseInt(e.target.value),
                  })
                }
                className="range range-primary mt-2 w-full"
              />
              <div className="flex justify-between text-xs text-base-content/60 mt-2">
                <span>€0</span>
                <span>€{((monthlyIncome * 5) / 100).toFixed(0)}</span>
                <span>€{((monthlyIncome * 10) / 100).toFixed(0)}</span>
                <span>€{((monthlyIncome * 15) / 100).toFixed(0)}</span>
                <span>€{((monthlyIncome * 20) / 100).toFixed(0)}</span>
              </div>
              <p className="text-sm text-base-content/60 mt-2">
                {formData.savingsPercentage}% van je maandinkomen (€
                {monthlyIncome.toFixed(0)})
              </p>
            </div>

            <div>
              <label className="label-text">Optioneel: Streefbedrag (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.targetAmount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className="input input-bordered w-full mt-1"
                placeholder="Laat leeg voor doorlopend sparen"
              />
              {formData.targetAmount > 0 && (
                <p className="text-sm text-base-content/60 mt-1">
                  {projectedCompletionDate
                    ? `Verwacht bereikt in ${projectedCompletionDate}`
                    : "Vul een maandelijkse bijdrage in voor een inschatting."}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Wants: Standard fixed amount */
          <div>
            <label className="label-text">Streefbedrag (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetAmount: parseFloat(e.target.value),
                })
              }
              className="input input-bordered w-full"
              required
            />
          </div>
        )}

        {/* Monthly contribution - only show for wants type */}
        {formData.budgetType === "wants" && (
          <div>
            <label className="label-text">Maandelijks Sparen (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.monthlyContribution}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthlyContribution: parseFloat(e.target.value),
                })
              }
              className="input input-bordered w-full"
              required
            />
            <p className="text-sm text-base-content/60 mt-1">
              {formData.targetAmount > 0 &&
              formData.monthlyContribution > 0 && (
                projectedCompletionDate
                  ? `Verwacht bereikt in ${projectedCompletionDate}`
                  : null
              )}
            </p>
          </div>
        )}

        {/* Account Selection - shown when monthlyContribution > 0 */}
        {formData.monthlyContribution && formData.monthlyContribution > 0 && (
          <div className="space-y-4 p-4 bg-base-300 rounded-lg">
            <h4 className="text-sm font-semibold text-base-content/80">
              💸 Automatische Overboeking
            </h4>
            <div>
              <label className="label-text">Van Rekening</label>
              <select
                value={formData.fromAccountId}
                onChange={(e) =>
                  setFormData({ ...formData, fromAccountId: e.target.value })
                }
                className="select w-full select-bordered"
                required
              >
                <option value="">Selecteer bron rekening...</option>
                {accounts
                  .filter((acc) => acc.type !== "credit-card")
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
              </select>
              <p className="text-sm text-base-content/60 mt-1">
                Waar komt het geld vandaan?
              </p>
            </div>
            <div>
              <label className="label-text">Naar Rekening</label>
              <select
                value={formData.toAccountId}
                onChange={(e) =>
                  setFormData({ ...formData, toAccountId: e.target.value })
                }
                className="select w-full select-bordered"
                required
              >
                <option value="">Selecteer doel rekening...</option>
                {accounts
                  .filter((acc) => acc.type !== "credit-card")
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
              </select>
              <p className="text-sm text-base-content/60 mt-1">
                Waar wordt het geld naartoe overgemaakt?
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="label-text">Prioriteit</label>
          <select
            value={formData.priority}
            onChange={(e) =>
              setFormData({
                ...formData,
                priority: e.target.value as any,
              })
            }
            className="select w-full select-bordered"
          >
            <option value="high">Hoog</option>
            <option value="medium">Gemiddeld</option>
            <option value="low">Laag</option>
          </select>
        </div>

        <div className="flex gap-2 pt-4">
          <button type="button" onClick={onCancel} className="btn flex-1">
            Annuleren
          </button>
          <button type="submit" className="btn btn-primary flex-1">
            {editingGoal ? "Bijwerken" : "Toevoegen"}
          </button>
        </div>
      </form>
    </div>
  );
}
