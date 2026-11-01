"use client";

import { useState } from "react";
import type { BudgetBreakdown } from "@/services/budget-service";
import type { FinancialData } from "@/types/finance";
import type {
  FinancialConfiguration,
  Frequency,
} from "@/types/financial-config";
import type { SavingsGoal } from "@/types/savings-goals";
import { formatCurrency } from "@/utils/formatters";

interface SpendingAdjusterProps {
  config: FinancialConfiguration;
  financialData: FinancialData;
  budgetBreakdown: BudgetBreakdown;
  goals: SavingsGoal[];
  onSaved: () => Promise<void>;
}

type AdjustmentSource =
  | {
      kind: "expense";
      id: string;
      amount: number;
      multiplier: number;
    }
  | {
      kind: "transaction";
      id: string;
      amount: number;
      multiplier: number;
    }
  | {
      kind: "goal";
      id: string;
      amount: number;
      multiplier: 1;
    };

interface AdjustmentRow {
  key: string;
  label: string;
  detail?: string;
  amount: number;
  kind: "expense" | "saving";
  sources: AdjustmentSource[];
  canSave: boolean;
}

const MONTHLY_MULTIPLIER: Record<Frequency, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

function getMonthlyIncome(config: FinancialConfiguration): number {
  return config.incomeSources
    .filter((source) => source.isActive)
    .reduce(
      (total, source) =>
        total + source.amount * MONTHLY_MULTIPLIER[source.frequency],
      0,
    );
}

function roundToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function getTransactionMultiplier(type?: string): number {
  switch (type) {
    case "yearly":
      return 1 / 12;
    case "weekly":
      return 52 / 12;
    case "daily":
      return 365 / 12;
    default:
      return 1;
  }
}

function formatCategory(category: string, financialData: FinancialData) {
  const foundCategory = financialData.categories.find(
    (item) => item.id === category,
  );
  const label = foundCategory?.name ?? category;
  if (
    label.toLocaleLowerCase("nl-NL") === "uncategorized" ||
    label.toLocaleLowerCase("nl-NL") === "onbekend"
  ) {
    return "Overig / niet gecategoriseerd";
  }
  if (/^cat[-_]/i.test(label)) {
    return "Overig / niet gecategoriseerd";
  }
  return label.charAt(0).toLocaleUpperCase("nl-NL") + label.slice(1);
}

function buildRows(
  breakdown: BudgetBreakdown,
  financialData: FinancialData,
  config: FinancialConfiguration,
  goals: SavingsGoal[],
): AdjustmentRow[] {
  const expenseGroups = new Map<
    string,
    {
      category: string;
      kind: "needs" | "wants";
      amount: number;
      names: Set<string>;
      sources: Map<string, AdjustmentSource>;
    }
  >();

  for (const kind of ["needs", "wants"] as const) {
    for (const item of breakdown[kind].items) {
      const category = formatCategory(item.category, financialData);
      const key = `${kind}:${category.toLocaleLowerCase("nl-NL")}`;
      const group = expenseGroups.get(key) ?? {
        category,
        kind,
        amount: 0,
        names: new Set<string>(),
        sources: new Map<string, AdjustmentSource>(),
      };
      group.amount += item.amount;
      group.names.add(item.name);
      for (const expense of config.recurringExpenses || []) {
        if (
          expense.isActive &&
          expense.name.trim().toLocaleLowerCase("nl-NL") ===
            item.name.trim().toLocaleLowerCase("nl-NL") &&
          formatCategory(expense.category, financialData) === category
        ) {
          const multiplier = MONTHLY_MULTIPLIER[expense.frequency];
          group.sources.set(`expense:${expense.id}`, {
            kind: "expense",
            id: expense.id,
            amount: expense.amount * multiplier,
            multiplier,
          });
        }
      }
      for (const transaction of financialData.transactions) {
        if (
          transaction.type === "expense" &&
          transaction.isRecurring &&
          transaction.description.trim().toLocaleLowerCase("nl-NL") ===
            item.name.trim().toLocaleLowerCase("nl-NL") &&
          formatCategory(transaction.category, financialData) === category
        ) {
          const multiplier = getTransactionMultiplier(
            transaction.recurringType,
          );
          group.sources.set(`transaction:${transaction.id}`, {
            kind: "transaction",
            id: transaction.id,
            amount: Math.abs(transaction.amount) * multiplier,
            multiplier,
          });
        }
      }
      expenseGroups.set(key, group);
    }
  }

  const expenses = [...expenseGroups.entries()].map(([key, group]) => ({
    key,
    label: group.category,
    detail: [...group.names].join(", "),
    amount: group.amount,
    kind: "expense" as const,
    sources: [...group.sources.values()],
    canSave:
      group.sources.size > 0 &&
      Math.abs(
        [...group.sources.values()].reduce(
          (total, source) => total + source.amount,
          0,
        ) - group.amount,
      ) < 0.02,
  }));
  const savings = new Map<
    string,
    {
      row: AdjustmentRow;
      sources: Map<string, AdjustmentSource>;
    }
  >();

  for (const item of breakdown.savings.items) {
    const label =
      item.name.trim() || formatCategory(item.category, financialData);
    const key = `saving:${label.toLocaleLowerCase("nl-NL")}`;
    const existing = savings.get(key) ?? {
      row: {
        key,
        label,
        amount: 0,
        kind: "saving" as const,
        sources: [],
        canSave: false,
      },
      sources: new Map<string, AdjustmentSource>(),
    };
    existing.row.amount += item.amount;
    const matchingExpenses = (config.recurringExpenses || []).filter(
      (expense) =>
        expense.isActive &&
        expense.name.trim().toLocaleLowerCase("nl-NL") ===
          label.toLocaleLowerCase("nl-NL"),
    );
    const matchingExpenseAmount = matchingExpenses.reduce(
      (total, expense) =>
        total + expense.amount * MONTHLY_MULTIPLIER[expense.frequency],
      0,
    );
    if (
      matchingExpenses.length > 0 &&
      Math.abs(matchingExpenseAmount - item.amount) < 0.02
    ) {
      for (const expense of matchingExpenses) {
        const multiplier = MONTHLY_MULTIPLIER[expense.frequency];
        existing.sources.set(`expense:${expense.id}`, {
          kind: "expense",
          id: expense.id,
          amount: expense.amount * multiplier,
          multiplier,
        });
      }
    } else {
      for (const goal of goals) {
        if (
          goal.name.trim().toLocaleLowerCase("nl-NL") ===
            label.toLocaleLowerCase("nl-NL") &&
          goal.monthlyContribution
        ) {
          existing.sources.set(`goal:${goal.id}`, {
            kind: "goal",
            id: goal.id,
            amount: item.amount,
            multiplier: 1,
          });
        }
      }
    }
    savings.set(key, existing);
  }

  const savingRows = [...savings.values()].map(({ row, sources }) => {
    row.sources = [...sources.values()];
    row.canSave =
      sources.size > 0 &&
      Math.abs(
        row.sources.reduce((total, source) => total + source.amount, 0) -
          row.amount,
      ) < 0.02;
    return row;
  });

  return [...expenses, ...savingRows].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "expense" ? -1 : 1;
    return a.label.localeCompare(b.label, "nl");
  });
}

export function SpendingAdjuster({
  config,
  financialData,
  budgetBreakdown,
  goals,
  onSaved,
}: SpendingAdjusterProps) {
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const rows = buildRows(budgetBreakdown, financialData, config, goals);
  const income = getMonthlyIncome(config);
  const baselineExpenses =
    budgetBreakdown.needs.spent + budgetBreakdown.wants.spent;
  const baselineSavings = budgetBreakdown.savings.spent;
  const baselineNet = roundToCents(income - baselineExpenses - baselineSavings);
  const adjustedExpenses = rows
    .filter((row) => row.kind === "expense")
    .reduce((total, row) => total + (adjustments[row.key] ?? row.amount), 0);
  const adjustedSavings = rows
    .filter((row) => row.kind === "saving")
    .reduce((total, row) => total + (adjustments[row.key] ?? row.amount), 0);
  const adjustedNet = roundToCents(income - adjustedExpenses - adjustedSavings);
  const totalReduction = roundToCents(
    rows.reduce(
      (total, row) => total + row.amount - (adjustments[row.key] ?? row.amount),
      0,
    ),
  );
  const hasChanges = totalReduction > 0.005;
  const hasUnsavableChanges = rows.some(
    (row) =>
      !row.canSave &&
      Math.abs((adjustments[row.key] ?? row.amount) - row.amount) > 0.005,
  );

  const saveChanges = async () => {
    if (saving || hasUnsavableChanges || !hasChanges) return;
    setSaving(true);
    setSaveMessage("");

    try {
      for (const row of rows) {
        const updatedAmount = adjustments[row.key] ?? row.amount;
        if (Math.abs(updatedAmount - row.amount) <= 0.005) continue;

        const factor = row.amount > 0 ? updatedAmount / row.amount : 0;
        for (const source of row.sources) {
          let response: Response;
          if (source.kind === "expense") {
            const expense = config.recurringExpenses.find(
              (item) => item.id === source.id,
            );
            if (!expense)
              throw new Error(`Uitgave ${source.id} niet gevonden.`);
            response = await fetch("/api/config/expenses", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...expense,
                id: expense.id,
                amount: roundToCents(
                  (source.amount * factor) / source.multiplier,
                ),
              }),
            });
          } else if (source.kind === "transaction") {
            const transaction = financialData.transactions.find(
              (item) => item.id === source.id,
            );
            if (!transaction) {
              throw new Error(
                `Terugkerende uitgave ${source.id} niet gevonden.`,
              );
            }
            const sign = transaction.amount < 0 ? -1 : 1;
            response = await fetch(
              `/api/finance/transactions/${encodeURIComponent(source.id)}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amount: roundToCents(
                    (source.amount * factor * sign) / source.multiplier,
                  ),
                }),
              },
            );
          } else {
            const goal = goals.find((item) => item.id === source.id);
            if (!goal) throw new Error(`Spaardoel ${source.id} niet gevonden.`);
            response = await fetch(
              `/api/savings-goals/${encodeURIComponent(source.id)}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  monthlyContribution: roundToCents(source.amount * factor),
                }),
              },
            );
          }

          if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(
              errorBody?.error || `Opslaan mislukt (${response.status}).`,
            );
          }
        }
      }

      setAdjustments({});
      await onSaved();
      setSaveMessage("Je wijzigingen zijn opgeslagen.");
    } catch (error) {
      console.error("Failed to save spending adjustments:", error);
      setSaveMessage(
        error instanceof Error
          ? `Niet alles kon worden opgeslagen: ${error.message}`
          : "Niet alles kon worden opgeslagen. Probeer het opnieuw.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body">
        <div>
          <h2 className="card-title">Wat als je bedragen aanpast?</h2>
          <p className="text-sm text-base-content/70">
            Verken wat lagere uitgaven of spaarbijdragen doen met je
            maandruimte. Sla je wijzigingen op om de bedragen echt aan te
            passen.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-base-200 p-3">
            <p className="text-xs text-base-content/70">Saldo deze maand</p>
            <p className="text-lg font-semibold">
              {formatCurrency(baselineNet)}/mnd
            </p>
          </div>
          <div className="rounded-lg bg-base-200 p-3">
            <p className="text-xs text-base-content/70">
              Vrijgespeeld in simulatie
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(totalReduction)}/mnd
            </p>
          </div>
          <div
            className={`rounded-lg p-3 ${
              adjustedNet < 0 ? "bg-error/10" : "bg-success/10"
            }`}
          >
            <p className="text-xs text-base-content/70">Nieuw saldo</p>
            <p
              className={`text-lg font-semibold ${
                adjustedNet < 0 ? "text-error" : "text-success"
              }`}
            >
              {formatCurrency(adjustedNet)}/mnd
            </p>
          </div>
        </div>

        <p
          className={`text-sm font-medium ${
            adjustedNet < 0 ? "text-error" : "text-success"
          }`}
          aria-live="polite"
        >
          {adjustedNet < 0
            ? `Je komt nog ${formatCurrency(Math.abs(adjustedNet))} per maand tekort.`
            : adjustedNet === 0
              ? "Met deze aanpassingen kom je precies uit."
              : `Met deze aanpassingen houd je ${formatCurrency(adjustedNet)} per maand over.`}
        </p>

        {rows.length === 0 ? (
          <p className="text-sm text-base-content/70">
            Er zijn geen uitgaven of spaarbedragen beschikbaar om te simuleren.
          </p>
        ) : (
          <div className="space-y-5">
            {(["expense", "saving"] as const).map((kind) => {
              const sectionRows = rows.filter((row) => row.kind === kind);
              if (sectionRows.length === 0) return null;

              return (
                <div key={kind} className="space-y-3">
                  <h3 className="font-semibold">
                    {kind === "expense"
                      ? "Uitgaven per categorie"
                      : "Spaarbedragen"}
                  </h3>
                  {sectionRows.map((row) => {
                    const value = adjustments[row.key] ?? row.amount;
                    return (
                      <div
                        key={row.key}
                        className="grid grid-cols-3 gap-x-4 gap-y-2 sm:items-center"
                      >
                        <div className="min-w-0">
                          <label
                            htmlFor={`adjustment-${row.key}`}
                            className="font-medium"
                          >
                            {row.label}
                          </label>
                          {row.detail && (
                            <p className="truncate text-xs text-base-content/60">
                              {row.detail}
                            </p>
                          )}
                          {!row.canSave && (
                            <p className="text-xs text-warning">
                              Deze regel kan hier niet worden opgeslagen.
                            </p>
                          )}
                        </div>
                        <input
                          id={`adjustment-${row.key}`}
                          type="range"
                          min="0"
                          max={row.amount}
                          step="0.01"
                          value={value}
                          disabled={row.amount <= 0 || !row.canSave}
                          className="range range-primary range-sm w-full"
                          aria-label={`${row.kind === "expense" ? "Uitgaven" : "Spaarbijdrage"} ${row.label} per maand`}
                          onChange={(event) => {
                            const nextValue = roundToCents(
                              Math.min(
                                row.amount,
                                Math.max(0, Number(event.target.value)),
                              ),
                            );
                            setAdjustments((current) => ({
                              ...current,
                              [row.key]: nextValue,
                            }));
                          }}
                        />
                        <div className="flex items-center justify-between gap-3 text-sm sm:block sm:text-right">
                          <span className="text-base-content/60">
                            was {formatCurrency(row.amount)}
                          </span>
                          <span className="min-w-20 font-semibold">
                            {formatCurrency(value)}/mnd
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-base-300 pt-4">
          {hasChanges && !hasUnsavableChanges && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={saveChanges}
              disabled={saving}
            >
              {saving ? "Opslaan..." : "Wijzigingen opslaan"}
            </button>
          )}
          {hasChanges && hasUnsavableChanges && (
            <p className="text-sm text-warning">
              Een of meer aangepaste regels zijn niet rechtstreeks aan een
              opgeslagen terugkerende uitgave of spaardoel gekoppeld. Pas alleen
              de schuifregelaars aan van regels die opgeslagen kunnen worden.
            </p>
          )}
          {saveMessage && (
            <output
              aria-live="polite"
              className={`text-sm ${
                saveMessage.startsWith("Niet alles")
                  ? "text-error"
                  : "text-success"
              }`}
            >
              {saveMessage}
            </output>
          )}
          {hasChanges && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setAdjustments({});
                setSaveMessage("");
              }}
              disabled={saving}
            >
              Herstel beginsituatie
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
