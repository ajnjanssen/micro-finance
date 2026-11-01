"use client";

import { SpendingAdjuster } from "@/components/advice/SpendingAdjuster";
import type { BudgetBreakdown } from "@/services/budget-service";
import type { FinancialData } from "@/types/finance";
import type { FinancialConfiguration } from "@/types/financial-config";
import type { SavingsGoal } from "@/types/savings-goals";
import { formatCurrency } from "@/utils/formatters";

interface FinancialPlanProps {
  config: FinancialConfiguration;
  financialData: FinancialData;
  goals: SavingsGoal[];
  budgetBreakdown: BudgetBreakdown;
  onSaved: () => Promise<void>;
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonth(value: string | Date): string {
  const date = typeof value === "string" ? parseLocalDate(value) : value;
  return date.toLocaleDateString("nl-NL", {
    month: "long",
    year: "numeric",
  });
}

function monthsUntil(date: Date, now: Date): number {
  return Math.max(
    1,
    (date.getFullYear() - now.getFullYear()) * 12 +
      date.getMonth() -
      now.getMonth() +
      (date.getDate() > now.getDate() ? 1 : 0),
  );
}

export function FinancialPlan({
  config,
  financialData,
  goals,
  budgetBreakdown,
  onSaved,
}: FinancialPlanProps) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const horizon = new Date(now);
  horizon.setMonth(horizon.getMonth() + 12);

  const goalPlans = goals
    .filter((goal) => !goal.spentDate && goal.targetAmount > 0)
    .map((goal) => {
      const current = Math.min(
        goal.targetAmount,
        Math.max(0, goal.currentAmount),
      );
      const remaining = Math.max(0, goal.targetAmount - current);
      const deadline = goal.deadline ? parseLocalDate(goal.deadline) : null;
      const contribution = goal.monthlyContribution || 0;
      const startDate = goal.startDate ? parseLocalDate(goal.startDate) : now;
      const contributionStart = startDate > now ? startDate : now;
      const deadlinePassed = deadline !== null && deadline < now;
      const startAfterDeadline = deadline !== null && startDate > deadline;
      const monthsRemaining =
        deadline && !deadlinePassed
          ? Math.max(
              1,
              (deadline.getFullYear() - contributionStart.getFullYear()) * 12 +
                deadline.getMonth() -
                contributionStart.getMonth() +
                1,
            )
          : null;
      const requiredContribution =
        remaining > 0 && monthsRemaining ? remaining / monthsRemaining : 0;
      const estimatedMonths =
        remaining === 0
          ? 0
          : contribution > 0
            ? Math.ceil(remaining / contribution)
            : null;
      const estimatedDate =
        estimatedMonths === null
          ? null
          : new Date(
              contributionStart.getFullYear(),
              contributionStart.getMonth() + estimatedMonths - 1,
              1,
            );
      const isBehind =
        deadline !== null &&
        remaining > 0 &&
        (deadlinePassed ||
          startAfterDeadline ||
          contribution < requiredContribution);

      return {
        ...goal,
        current,
        remaining,
        contribution,
        deadline,
        deadlinePassed,
        startAfterDeadline,
        requiredContribution,
        estimatedDate,
        isBehind,
      };
    })
    .sort((a, b) => {
      if (a.isBehind !== b.isBehind) return a.isBehind ? -1 : 1;
      return (b.priority === "high" ? 1 : 0) - (a.priority === "high" ? 1 : 0);
    });

  const endingIncome = config.incomeSources
    .flatMap((source) => {
      if (!source.isActive || !source.endDate) return [];
      const endDate = parseLocalDate(source.endDate);
      return endDate >= now && endDate <= horizon
        ? [{ source, endDate: source.endDate }]
        : [];
    })
    .sort((a, b) => a.endDate.localeCompare(b.endDate));

  const upcomingExpenses = [
    ...(config.oneTimeExpenses || [])
      .filter((expense) => !expense.isPaid)
      .map((expense) => ({
        name: expense.name,
        amount: Math.abs(expense.amount),
        date: expense.date,
      })),
    ...financialData.transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.completed === false &&
          !transaction.isRecurring,
      )
      .map((transaction) => ({
        name: transaction.description,
        amount: Math.abs(transaction.amount),
        date: transaction.date,
      })),
  ]
    .filter((expense) => {
      const date = parseLocalDate(expense.date);
      return date >= now && date <= horizon;
    })
    .filter(
      (expense, index, expenses) =>
        expenses.findIndex(
          (other) =>
            other.date.slice(0, 10) === expense.date.slice(0, 10) &&
            Math.abs(other.amount - expense.amount) < 0.01 &&
            other.name.toLowerCase() === expense.name.toLowerCase(),
        ) === index,
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const costlyDebts = (config.liabilities || [])
    .filter(
      (debt) =>
        debt.isActive && debt.currentBalance > 0 && debt.interestRate >= 6,
    )
    .map((debt) => ({
      ...debt,
      estimatedMonthlyInterest:
        (debt.currentBalance * debt.interestRate) / 1200,
    }))
    .sort((a, b) => b.interestRate - a.interestRate);
  const monthlyInterest = costlyDebts.reduce(
    (total, debt) => total + debt.estimatedMonthlyInterest,
    0,
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Vooruit plannen</h2>
        <p className="text-sm text-base-content/70">
          Hier vind je beslissingen voor de komende maanden en lange termijn;
          actuele saldi en maandcijfers staan op het dashboard.
        </p>
      </div>

      <SpendingAdjuster
        config={config}
        financialData={financialData}
        budgetBreakdown={budgetBreakdown}
        goals={goals}
        onSaved={onSaved}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Spaardoelen: haalbaarheid</h3>
            {goalPlans.length === 0 ? (
              <p className="text-sm text-base-content/70">
                Er zijn geen actieve spaardoelen. Maak een doel met een bedrag,
                maandelijkse bijdrage en gewenste datum om je voortgang te
                kunnen plannen.
              </p>
            ) : (
              <div className="space-y-4">
                {goalPlans.map((goal) => {
                  const progress = (goal.current / goal.targetAmount) * 100;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{goal.name}</p>
                          <p className="text-xs text-base-content/70">
                            {formatCurrency(goal.current)} van{" "}
                            {formatCurrency(goal.targetAmount)} · nog{" "}
                            {formatCurrency(goal.remaining)}
                          </p>
                        </div>
                        {goal.isBehind ? (
                          <span className="badge badge-warning">
                            {goal.deadlinePassed
                              ? "Deadline verstreken"
                              : "Achter op schema"}
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            {goal.remaining === 0 ? "Behaald" : "Op schema"}
                          </span>
                        )}
                      </div>
                      <progress
                        className={`progress w-full ${
                          goal.isBehind
                            ? "progress-warning"
                            : "progress-primary"
                        }`}
                        value={progress}
                        max="100"
                      />
                      <p className="text-xs text-base-content/70">
                        {goal.remaining === 0
                          ? "Doelbedrag bereikt."
                          : goal.deadline
                            ? goal.deadlinePassed
                              ? `De deadline van ${formatMonth(goal.deadline)} is verstreken. Er staat nog ${formatCurrency(goal.remaining)} open.`
                              : goal.startAfterDeadline
                                ? `De geplande startdatum valt na de deadline van ${formatMonth(goal.deadline)}. Pas de startdatum of deadline aan.`
                                : `Nodig: ${formatCurrency(goal.requiredContribution)}/maand om ${formatMonth(goal.deadline)} te halen. Huidige bijdrage: ${formatCurrency(goal.contribution)}/maand.`
                            : goal.estimatedDate
                              ? `Bij ${formatCurrency(goal.contribution)}/maand is het doel naar verwachting bereikt in ${formatMonth(goal.estimatedDate)}.`
                              : "Stel een maandelijkse bijdrage in om een verwachte einddatum te berekenen."}
                      </p>
                      {goal.isBehind && (
                        <a
                          href="/spaardoelen"
                          className="link link-primary text-sm"
                        >
                          Pas bedrag of deadline aan
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Komende financiële momenten</h3>
            {upcomingExpenses.length === 0 && endingIncome.length === 0 ? (
              <p className="text-sm text-base-content/70">
                Geen geplande eenmalige uitgaven of aflopende inkomsten in de
                komende 12 maanden. Voeg geplande bedragen toe om ze hier mee te
                nemen.
              </p>
            ) : (
              <div className="space-y-4">
                {endingIncome.length > 0 && (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                    <p className="font-semibold">Inkomstenbron loopt af</p>
                    {endingIncome.map(({ source, endDate }) => (
                      <p key={source.id} className="mt-1 text-sm">
                        {source.name} eindigt {formatMonth(endDate)}. Bekijk
                        tijdig welk inkomen dit daarna vervangt.
                      </p>
                    ))}
                  </div>
                )}
                {upcomingExpenses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">
                      Geplande uitgaven binnen 12 maanden
                    </p>
                    {upcomingExpenses.map((expense, index) => {
                      const date = parseLocalDate(expense.date);
                      const months = monthsUntil(date, now);
                      return (
                        <div
                          key={`${expense.date}-${expense.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg bg-base-200 p-3"
                        >
                          <div>
                            <p className="font-medium">{expense.name}</p>
                            <p className="text-xs text-base-content/70">
                              {formatMonth(expense.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(expense.amount)}
                            </p>
                            <p className="text-xs text-base-content/70">
                              Reserveer circa{" "}
                              {formatCurrency(expense.amount / months)}/maand
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title">Schuldenstrategie</h3>
            {costlyDebts.length === 0 ? (
              <p className="text-sm text-base-content/70">
                Geen actieve schuld met een rente van 6% of hoger gevonden. Geef
                prioriteit aan betaalverplichtingen en houd je buffer op peil
                voordat je extra aflost.
              </p>
            ) : (
              <>
                <p className="text-sm text-base-content/70">
                  De geschatte rente op deze schulden is samen ongeveer{" "}
                  {formatCurrency(monthlyInterest)}/maand. Dit is een benadering
                  op basis van het huidige saldo en de opgegeven jaarrente;
                  controleer de werkelijke rente bij de aanbieder.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {costlyDebts.map((debt) => (
                    <div key={debt.id} className="rounded-lg bg-base-200 p-3">
                      <p className="font-semibold">{debt.name}</p>
                      <p className="text-sm">
                        {debt.interestRate}% rente · saldo{" "}
                        {formatCurrency(debt.currentBalance)}
                      </p>
                      <p className="text-xs text-base-content/70">
                        Circa {formatCurrency(debt.estimatedMonthlyInterest)}{" "}
                        rente per maand
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-sm">
                  Als je ruimte hebt om extra af te lossen, vergelijk dan eerst
                  de rentepercentages en eventuele boetes. Een hogere rente
                  eerst aflossen verlaagt doorgaans de rentekosten het meest.
                </p>
              </>
            )}
            <a href="/vermogen" className="link link-primary text-sm">
              Bekijk je schulden en vermogensprognose
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
