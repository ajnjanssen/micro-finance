import { formatCurrency } from "@/utils/formatters";
import { useEffect, useState } from "react";

interface SavingsBreakdownProps {
  savingsAccountBalance: number;
  savingsAccountId: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  spentDate?: string;
}

export function SavingsBreakdown({ savingsAccountBalance, savingsAccountId }: SavingsBreakdownProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      // Load both goals and transactions to calculate current amounts
      const [goalsResponse, transactionsResponse] = await Promise.all([
        fetch("/api/savings-goals"),
        fetch("/api/finance"),
      ]);

      const goalsData = await goalsResponse.json();
      const transactionsData = await transactionsResponse.json();
      
      const loadedGoals = Array.isArray(goalsData) ? goalsData : goalsData.goals || [];
      const transactions = transactionsData.transactions || [];

      // Calculate currentAmount for each goal based on linked transactions
      const goalsWithProgress = loadedGoals.map((goal: any) => {
        const linkedTransactions = transactions.filter(
          (t: any) => t.savingsGoalId === goal.id
        );
        
        // Sum up all linked savings transactions
        const totalSaved = linkedTransactions.reduce(
          (sum: number, t: any) => sum + Math.abs(t.amount),
          0
        );

        return {
          ...goal,
          currentAmount: totalSaved,
        };
      });

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error("Error loading savings goals:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="text-xl font-bold mb-4">Spaarrekening Overzicht</h3>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-base-300 rounded w-3/4" />
            <div className="h-4 bg-base-300 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Calculate allocated amounts (goals not yet spent)
  const activeGoals = goals.filter(g => !g.spentDate);
  const totalAllocated = activeGoals.reduce((sum, goal) => {
    return sum + Math.min(goal.currentAmount, goal.targetAmount);
  }, 0);

  // Calculate spent amounts (completed goals that were spent)
  const spentGoals = goals.filter(g => g.spentDate);
  const totalSpent = spentGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  // Available = current balance + what was spent - what's allocated
  const availableSavings = savingsAccountBalance;
  const netAvailable = availableSavings - totalAllocated;

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold">Spaarrekening Overzicht</h3>
          <div className="tooltip" data-tip="Je spaargeld verdeeld over beschikbaar en gealloceerd voor doelen">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          {/* Total in savings account */}
          <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
            <span className="font-medium">Totaal op Spaarrekening</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(savingsAccountBalance)}
            </span>
          </div>

          {/* Allocated to goals */}
          {activeGoals.length > 0 && (
            <div className="pl-4 border-l-2 border-warning space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70">
                  Gealloceerd voor {activeGoals.length} doel{activeGoals.length > 1 ? 'en' : ''}
                </span>
                <span className="font-semibold text-warning">
                  -{formatCurrency(totalAllocated)}
                </span>
              </div>
              {activeGoals.map(goal => (
                <div key={goal.id} className="text-xs flex justify-between text-base-content/60">
                  <span className="truncate mr-2">{goal.name}</span>
                  <span>{formatCurrency(Math.min(goal.currentAmount, goal.targetAmount))}</span>
                </div>
              ))}
            </div>
          )}

          {/* Available savings */}
          <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border-2 border-success/30">
            <div>
              <span className="font-medium block">Vrij Beschikbaar</span>
              <span className="text-xs text-base-content/60">
                Niet toegewezen aan doelen
              </span>
            </div>
            <span className="text-xl font-bold text-success">
              {formatCurrency(netAvailable)}
            </span>
          </div>

          {/* Spent on goals */}
          {spentGoals.length > 0 && (
            <div className="text-xs text-base-content/60 pt-2 border-t">
              <div className="flex justify-between">
                <span>Uitgegeven aan {spentGoals.length} voltooid{spentGoals.length > 1 ? 'e' : ''} doel{spentGoals.length > 1 ? 'en' : ''}</span>
                <span>{formatCurrency(totalSpent)}</span>
              </div>
            </div>
          )}
        </div>

        {activeGoals.length === 0 && spentGoals.length === 0 && (
          <div className="alert alert-info mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">
              Je hebt nog geen spaardoelen. Al je spaargeld is vrij beschikbaar.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
