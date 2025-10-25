"use client";

import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import LoadingState from "@/components/ui/LoadingState";
import PageHeader from "@/components/ui/PageHeader";
import { SavingsTransactionsModal } from "@/components/savings-goals/SavingsTransactionsModal";
import { differenceInMonths, addMonths, format } from "date-fns";
import { nl } from "date-fns/locale";
import { useState } from "react";

export default function SpaardoelenPage() {
  const { goals, transactions, loading, reload } = useSavingsGoals();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [spendingGoalId, setSpendingGoalId] = useState<string | null>(null);

  const handleMarkAsSpent = async (goalId: string) => {
    if (!confirm("Weet je zeker dat je dit doel als uitgegeven wilt markeren? Dit zal een uitgave transactie aanmaken.")) {
      return;
    }

    try {
      const response = await fetch("/api/savings-goals/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId }),
      });

      if (response.ok) {
        await reload();
        alert("✅ Doel gemarkeerd als uitgegeven!");
      } else {
        const error = await response.json();
        alert(`❌ Fout: ${error.message || "Kon doel niet markeren"}`);
      }
    } catch (error) {
      console.error("Error marking goal as spent:", error);
      alert("❌ Er ging iets fout bij het markeren van het doel");
    }
  };

  if (loading) return <LoadingState />;

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader 
          title="Spaardoelen" 
          buttonLabel="+ Nieuw Spaardoel" 
          onButtonClick={() => alert("Nieuw spaardoel toevoegen")} 
        />

        {goals.length === 0 && (
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Je hebt nog geen spaardoelen. Voeg er een toe om je financiële doelen te bereiken!</span>
          </div>
        )}

        <div className="grid gap-4">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthlyContribution = goal.monthlyContribution || 500;
            const isCompleted = progress >= 100;
            const isSpent = !!goal.spentDate;
            
            // Calculate months until goal is reached
            const monthsRemaining = remaining > 0 && monthlyContribution > 0
              ? Math.ceil(remaining / monthlyContribution)
              : 0;
            
            const estimatedCompletion = monthsRemaining > 0
              ? addMonths(new Date(), monthsRemaining)
              : null;

            // Calculate if on track based on deadline
            let statusColor = "badge-success";
            let statusText = "Op schema";
            
            if (goal.deadline) {
              const deadlineDate = new Date(goal.deadline);
              const monthsUntilDeadline = differenceInMonths(deadlineDate, new Date());
              
              if (monthsUntilDeadline > 0) {
                const requiredMonthly = remaining / monthsUntilDeadline;
                if (requiredMonthly > monthlyContribution * 1.2) {
                  statusColor = "badge-error";
                  statusText = "Achter schema";
                } else if (requiredMonthly > monthlyContribution) {
                  statusColor = "badge-warning";
                  statusText = "Risico";
                }
              }
            }

            return (
              <div key={goal.id} className={`card bg-base-100 shadow ${isSpent ? "opacity-60" : ""}`}>
                <div className="card-body p-4">
                  {isSpent && (
                    <div className="badge badge-success mb-2">
                      ✅ Uitgegeven op {format(new Date(goal.spentDate!), "dd MMM yyyy", { locale: nl })}
                    </div>
                  )}
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    {goal.imageUrl && (
                      <div className="flex-shrink-0">
                        <img 
                          src={goal.imageUrl} 
                          alt={goal.name} 
                          className="w-20 h-20 object-cover rounded"
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-lg font-semibold truncate">{goal.name}</h3>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className="badge badge-sm badge-primary">{formatPercentage(progress)}</span>
                          <span className={`badge badge-sm ${statusColor}`}>{statusText}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-2">
                        <progress 
                          className="progress progress-primary w-full h-2" 
                          value={progress} 
                          max="100"
                        />
                        <div className="flex justify-between text-xs text-base-content/60 mt-1">
                          <span>{formatCurrency(goal.currentAmount)}</span>
                          <span>{formatCurrency(goal.targetAmount)}</span>
                        </div>
                      </div>

                      {/* Info row */}
                      <div className="flex gap-4 text-xs text-base-content/70 flex-wrap">
                        <span>💰 {formatCurrency(monthlyContribution)}/mnd</span>
                        {estimatedCompletion && (
                          <span>📅 {format(estimatedCompletion, "MMM ''yy", { locale: nl })} ({monthsRemaining}m)</span>
                        )}
                        {goal.deadline && (
                          <span>⏰ {format(new Date(goal.deadline), "dd MMM ''yy", { locale: nl })}</span>
                        )}
                        <span className="capitalize">🎯 {goal.priority}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-2">
                        <button 
                          className="btn btn-xs btn-outline"
                          onClick={() => setSelectedGoalId(goal.id)}
                        >
                          📊 Transacties
                        </button>
                        {goal.sourceUrl && (
                          <a 
                            href={goal.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-outline"
                          >
                            🔗 Bekijk
                          </a>
                        )}
                        {isCompleted && !isSpent && (
                          <button
                            className="btn btn-xs btn-success"
                            onClick={() => handleMarkAsSpent(goal.id)}
                          >
                            💸 Markeer als uitgegeven
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transactions Modal */}
        {selectedGoal && (
          <SavingsTransactionsModal
            goalId={selectedGoal.id}
            goalName={selectedGoal.name}
            transactions={transactions}
            isOpen={selectedGoalId !== null}
            onClose={() => setSelectedGoalId(null)}
          />
        )}
      </div>
    </div>
  );
}
