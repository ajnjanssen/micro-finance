"use client";

import { formatCurrency } from "@/utils/formatters";
import type { Debt } from "@/types/assets-liabilities";

interface DebtProjection {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface DebtProjectionViewProps {
  debt: Debt;
  onClose: () => void;
}

export function DebtProjectionView({ debt, onClose }: DebtProjectionViewProps) {
  const projections = calculateDebtProjections(debt);

  if (!projections.length) {
    return null;
  }

  const totalInterest = projections.reduce((sum, p) => sum + p.interest, 0);
  const totalPaid = projections.reduce((sum, p) => sum + p.payment, 0);
  const monthsToPayoff = projections.length;
  const finalBalance = projections[projections.length - 1]?.balance || 0;
  const willBeForgiven = finalBalance > 0.01;
  const totalPrincipalPaid = debt.currentBalance - finalBalance;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh]">
        <h3 className="font-bold text-lg mb-4">
          Aflossingsschema: {debt.name}
        </h3>

        {/* Summary Stats */}
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-6">
          <div className="stat">
            <div className="stat-title">Totaal Betaald</div>
            <div className="stat-value text-lg">
              {formatCurrency(totalPaid)}
            </div>
            <div className="stat-desc">
              Hoofdsom: {formatCurrency(totalPrincipalPaid)}
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">Totale Rente</div>
            <div className="stat-value text-lg text-error">
              {formatCurrency(totalInterest)}
            </div>
            <div className="stat-desc">
              Over {(monthsToPayoff / 12).toFixed(1)} jaar
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">
              {willBeForgiven ? "Resterende Schuld" : "Status"}
            </div>
            <div
              className={`stat-value text-lg ${
                willBeForgiven ? "text-warning" : "text-success"
              }`}
            >
              {willBeForgiven ? formatCurrency(finalBalance) : "Afbetaald"}
            </div>
            <div className="stat-desc">
              {willBeForgiven
                ? "Wordt kwijtgescholden"
                : `Na ${monthsToPayoff} maanden`}
            </div>
          </div>
        </div>

        {/* Projection Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="table table-zebra table-pin-rows">
            <thead>
              <tr>
                <th>Maand</th>
                <th>Datum</th>
                <th className="text-right">Betaling</th>
                <th className="text-right">Hoofdsom</th>
                <th className="text-right">Rente</th>
                <th className="text-right">Restant</th>
              </tr>
            </thead>
            <tbody>
              {projections.map((proj, idx) => (
                <tr key={idx} className={idx % 12 === 0 ? "bg-base-200" : ""}>
                  <td>{proj.month}</td>
                  <td className="text-sm">{proj.date}</td>
                  <td className="text-right font-mono">
                    {formatCurrency(proj.payment)}
                  </td>
                  <td className="text-right font-mono text-success">
                    {formatCurrency(proj.principal)}
                  </td>
                  <td className="text-right font-mono text-error">
                    {formatCurrency(proj.interest)}
                  </td>
                  <td className="text-right font-mono font-semibold">
                    {formatCurrency(proj.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key Insights */}
        <div className="mt-6 space-y-2">
          {willBeForgiven ? (
            <>
              <div className="alert alert-success">
                <div>
                  <div className="font-semibold">✅ Kwijtschelding</div>
                  <div className="text-sm">
                    Na {(monthsToPayoff / 12).toFixed(0)} jaar betalen wordt €
                    {finalBalance.toFixed(2)} van je schuld kwijtgescholden. Je
                    betaalt in totaal €{totalPaid.toFixed(2)} (€
                    {totalPrincipalPaid.toFixed(2)} hoofdsom + €
                    {totalInterest.toFixed(2)} rente).
                  </div>
                </div>
              </div>
              <div className="alert alert-info">
                <div>
                  <div className="font-semibold">💡 Effectieve Kosten</div>
                  <div className="text-sm">
                    Van de oorspronkelijke €{debt.currentBalance.toFixed(2)}{" "}
                    schuld betaal je{" "}
                    {((totalPrincipalPaid / debt.currentBalance) * 100).toFixed(
                      1
                    )}
                    % terug. De overige{" "}
                    {((finalBalance / debt.currentBalance) * 100).toFixed(1)}%
                    wordt kwijtgescholden.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="alert alert-info">
                <div>
                  <div className="font-semibold">💡 Inzicht</div>
                  <div className="text-sm">
                    Je betaalt €{debt.monthlyPayment?.toFixed(2)} per maand. Van
                    je eerste betaling gaat €
                    {projections[0]?.principal.toFixed(2)} naar de hoofdsom en €
                    {projections[0]?.interest.toFixed(2)} naar rente.
                  </div>
                </div>
              </div>

              {debt.interestRate > 0 && (
                <div className="alert alert-warning">
                  <div>
                    <div className="font-semibold">⚠️ Rente Impact</div>
                    <div className="text-sm">
                      Door de {debt.interestRate}% rente betaal je in totaal €
                      {totalInterest.toFixed(2)} extra bovenop de hoofdsom van €
                      {debt.currentBalance.toFixed(2)}.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Sluiten
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

/**
 * Calculate debt amortization schedule
 * Supports both full payoff and forgiveness scenarios
 */
function calculateDebtProjections(debt: Debt): DebtProjection[] {
  if (!debt.monthlyPayment || debt.monthlyPayment <= 0) {
    return [];
  }

  const projections: DebtProjection[] = [];
  let balance = debt.currentBalance;
  const monthlyRate = debt.interestRate / 100 / 12;
  const payment = debt.monthlyPayment;
  let month = 0;
  const startDate = new Date(debt.startDate);
  const today = new Date();

  // Calculate max months: either until endDate or 100 years
  let maxMonths = 1200; // 100 years default cap
  if (debt.endDate) {
    const endDate = new Date(debt.endDate);
    const monthsDiff =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    maxMonths = Math.max(1, monthsDiff);
  }

  // Continue until we reach the end date (debt may still have balance - forgiveness)
  while (month < maxMonths) {
    month++;

    // Calculate current date
    const currentDate = new Date(today);
    currentDate.setMonth(currentDate.getMonth() + month);

    // If we haven't reached start date yet, no payments happen
    if (currentDate < startDate) {
      projections.push({
        month,
        date: currentDate.toLocaleDateString("nl-NL"),
        balance: debt.currentBalance,
        interest: 0,
        principal: 0,
        payment: 0,
      });
      continue;
    }

    // Calculate interest for this period
    const interest = balance * monthlyRate;

    // Calculate principal payment (can be negative if payment < interest)
    const principal = payment - interest;

    // Update balance: add interest, subtract payment
    balance = balance + interest - payment;

    // Balance can't go below 0 (you can't owe negative money)
    if (balance < 0) {
      balance = 0;
    }

    // Calculate date
    const projectionDate = new Date(startDate);
    projectionDate.setMonth(projectionDate.getMonth() + month);

    projections.push({
      month,
      date: projectionDate.toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "short",
      }),
      payment: Math.min(payment, principal + interest),
      principal: Math.max(0, principal),
      interest,
      balance: Math.max(0, balance),
    });
  }

  return projections;
}
