"use client";

import { useState, useEffect } from "react";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  monthlySavings: number;
  targetDate?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export type { SavingsGoal };

export default function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [monthlySavingsRate, setMonthlySavingsRate] = useState(367); // Default from calculation
  const [savingsAccountBalance, setSavingsAccountBalance] = useState(0);
  const [allocations, setAllocations] = useState<{ [goalId: string]: number }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: 0,
    currentSaved: 0,
    monthlySavings: 0, // Will be set from actual rate
    priority: "medium" as "low" | "medium" | "high",
  });

  const getAllocatedAmount = (goalId: string) => allocations[goalId] || 0;
  const getTotalAllocated = () =>
    Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
  const getRemainingToAllocate = () =>
    Math.max(0, savingsAccountBalance) - getTotalAllocated();

  // Load goals and calculate monthly savings rate
  useEffect(() => {
    loadGoals();
    calculateMonthlySavingsRate();
  }, []);

  const loadGoals = async () => {
    try {
      const response = await fetch("/api/savings-goals");
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlySavingsRate = async () => {
    try {
      // Get current monthly overview to calculate actual savings rate
      const response = await fetch("/api/finance/overview");
      const data = await response.json();

      if (data.monthlyOverview) {
        // Use the projected income minus expenses as savings rate
        const projectedIncome = data.monthlyOverview.projectedIncome || 0;
        const projectedExpenses = data.monthlyOverview.projectedExpenses || 0;
        const savingsRate = Math.max(0, projectedIncome - projectedExpenses);

        setMonthlySavingsRate(savingsRate);
        setNewGoal((prev) => ({ ...prev, monthlySavings: savingsRate }));
      }

      // Get actual savings account balance
      const financeResponse = await fetch("/api/finance");
      const financeData = await financeResponse.json();

      // Calculate savings account balance (past transactions only)
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      let savingsBalance = 0;
      financeData.transactions.forEach((tx: any) => {
        if (tx.accountId === "savings-1") {
          const txDate = new Date(tx.date);
          if (txDate <= today) {
            savingsBalance += tx.amount;
          }
        }
      });

      setSavingsAccountBalance(savingsBalance);
    } catch (error) {
      console.error("Error calculating savings rate:", error);
    }
  };

  const addOrEditGoal = async () => {
    if (!newGoal.name || newGoal.targetAmount <= 0) return;

    try {
      const action = editingGoal ? "update" : "add";
      const goalData = editingGoal
        ? { ...newGoal, id: editingGoal.id }
        : newGoal;

      const response = await fetch("/api/savings-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          goal: goalData,
        }),
      });

      if (response.ok) {
        await loadGoals(); // Reload goals from server
        resetForm();
      }
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };

  const editGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentSaved: goal.currentSaved,
      monthlySavings: goal.monthlySavings,
      priority: goal.priority as "low" | "medium" | "high",
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setNewGoal({
      name: "",
      targetAmount: 0,
      currentSaved: 0,
      monthlySavings: monthlySavingsRate,
      priority: "medium",
    });
    setEditingGoal(null);
    setShowAddForm(false);
  };

  const deleteGoal = async (id: string) => {
    try {
      const response = await fetch("/api/savings-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          goal: { id },
        }),
      });

      if (response.ok) {
        await loadGoals(); // Reload goals from server
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const updateGoalProgress = async (id: string, currentSaved: number) => {
    try {
      const response = await fetch("/api/savings-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          goal: { id, currentSaved },
        }),
      });

      if (response.ok) {
        await loadGoals(); // Reload goals from server
      }
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const calculateMonthsToGoal = (goal: SavingsGoal) => {
    const remaining = goal.targetAmount - getAllocatedAmount(goal.id);
    if (remaining <= 0) return 0;
    if (goal.monthlySavings <= 0) return Infinity;
    return Math.ceil(remaining / goal.monthlySavings);
  };

  const calculateTargetDate = (goal: SavingsGoal) => {
    const months = calculateMonthsToGoal(goal);
    if (months === 0) return "Bereikt!";
    if (months === Infinity) return "Onmogelijk";

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);
    return targetDate.toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
    });
  };

  const getProgressPercentage = (goal: SavingsGoal) => {
    return Math.min(
      (getAllocatedAmount(goal.id) / goal.targetAmount) * 100,
      100
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "badge-error";
      case "medium":
        return "badge-warning";
      case "low":
        return "badge-success";
      default:
        return "badge-neutral";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">
            🎯 Spaar Doelen
          </h1>
          <p className="text-base-content mt-1">
            Stel doelen en zie wanneer je ze bereikt met je huidige spaar tempo
          </p>
          <div className="mt-2 p-3 bg-success/5 border border-success/20 rounded-lg">
            <p className="text-sm text-success">
              💰 <strong>Huidig spaar tempo:</strong>{" "}
              {formatCurrency(monthlySavingsRate)} per maand
              <br />
              <span className="text-xs">
                Gebaseerd op je maandelijkse inkomen minus uitgaven
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
        >
          + Nieuw Doel
        </button>
      </div>

      {/* Add/Edit Goal Form */}
      {showAddForm && (
        <div className="card p-6 border border-primary/20">
          <h2 className="text-xl font-semibold text-base-content mb-4">
            {editingGoal ? "Spaar Doel Bewerken" : "Nieuw Spaar Doel"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Naam van het doel</label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, name: e.target.value })
                }
                placeholder="bijv. Motor, Vakantie, Huis"
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="label-text">Doel Bedrag (€)</label>
              <input
                type="number"
                value={newGoal.targetAmount || ""}
                onChange={(e) =>
                  setNewGoal({
                    ...newGoal,
                    targetAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="5000"
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="label-text">Reeds Gespaard (€)</label>
              <input
                type="number"
                value={newGoal.currentSaved || ""}
                onChange={(e) =>
                  setNewGoal({
                    ...newGoal,
                    currentSaved: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="label-text">
                Maandelijks Spaar Bedrag (€)
                <span className="text-xs text-base-content block">
                  Berekend: {formatCurrency(monthlySavingsRate)}/maand
                </span>
              </label>
              <input
                type="number"
                value={newGoal.monthlySavings}
                onChange={(e) =>
                  setNewGoal({
                    ...newGoal,
                    monthlySavings: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder={monthlySavingsRate.toString()}
                className="input input-bordered w-full"
              />
              <p className="text-xs text-base-content mt-1">
                Gebaseerd op je huidige financiële situatie
              </p>
            </div>
            <div>
              <label className="label-text">Prioriteit</label>
              <select
                value={newGoal.priority}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, priority: e.target.value as any })
                }
                className="select select-bordered w-full"
              >
                <option value="low">Laag</option>
                <option value="medium">Gemiddeld</option>
                <option value="high">Hoog</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={resetForm} className="btn btn-ghost">
              Annuleren
            </button>
            <button onClick={addOrEditGoal} className="btn btn-primary">
              {editingGoal ? "Doel Bijwerken" : "Doel Toevoegen"}
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-base-content mb-2">
            Geen spaar doelen nog
          </h3>
          <p className="text-base-content mb-4">
            Voeg je eerste spaar doel toe om te beginnen met sparen voor iets
            speciaals!
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            + Eerste Doel Toevoegen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allocation Summary */}
          <div className="md:col-span-2 card p-6 mb-6">
            <h3 className="text-lg font-semibold text-base-content mb-4">
              💰 Spaargeld Toewijzing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-success/5 rounded-lg p-4">
                <p className="text-sm text-success font-medium">
                  Beschikbaar Spaargeld
                </p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(Math.max(0, savingsAccountBalance))}
                </p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4">
                <p className="text-sm text-primary font-medium">Toegewezen</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(getTotalAllocated())}
                </p>
              </div>
              <div className="bg-base-200 rounded-lg p-4">
                <p className="text-sm text-base-content font-medium">
                  Resterend
                </p>
                <p
                  className={`text-2xl font-bold ${
                    getRemainingToAllocate() >= 0
                      ? "text-base-content"
                      : "text-error"
                  }`}
                >
                  {formatCurrency(getRemainingToAllocate())}
                </p>
              </div>
            </div>
          </div>

          {goals.map((goal) => {
            const progress = getProgressPercentage(goal);
            const monthsToGoal = calculateMonthsToGoal(goal);
            const targetDate = calculateTargetDate(goal);
            const isAchieved = getAllocatedAmount(goal.id) >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                className={`card p-6 border-l-4 ${
                  isAchieved ? "border-success" : "border-primary"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-base-content">
                      {goal.name}
                    </h3>
                    <span
                      className={`badge ${getPriorityColor(goal.priority)}`}
                    >
                      {goal.priority === "high"
                        ? "Hoog"
                        : goal.priority === "medium"
                        ? "Gemiddeld"
                        : "Laag"}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editGoal(goal)}
                      className="btn btn-ghost btn-sm"
                      title="Bewerken"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="btn btn-ghost btn-sm text-error"
                      title="Verwijderen"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm text-base-content mb-1">
                      <span>Voortgang</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-base-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          isAchieved ? "bg-success" : "bg-primary"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-base-content">Gespaard</p>
                      <p className="text-lg font-semibold text-base-content">
                        {formatCurrency(getAllocatedAmount(goal.id))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-base-content">Doel</p>
                      <p className="text-lg font-semibold text-base-content">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Allocation Section */}
                  <div className="bg-primary/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-primary">
                        Toewijzen aan doel:
                      </span>
                      <span className="text-sm text-primary">
                        €{getAllocatedAmount(goal.id).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={getAllocatedAmount(goal.id)}
                        onChange={(e) => {
                          const newAmount = parseFloat(e.target.value) || 0;
                          setAllocations((prev) => ({
                            ...prev,
                            [goal.id]: Math.min(
                              newAmount,
                              goal.targetAmount,
                              getRemainingToAllocate() +
                                getAllocatedAmount(goal.id)
                            ),
                          }));
                        }}
                        className="input input-bordered input-sm flex-1"
                        placeholder="0.00"
                      />
                      <button
                        onClick={() => {
                          const remaining = getRemainingToAllocate();
                          if (remaining > 0) {
                            const amountToAllocate = Math.min(
                              remaining,
                              goal.targetAmount - getAllocatedAmount(goal.id)
                            );
                            setAllocations((prev) => ({
                              ...prev,
                              [goal.id]:
                                getAllocatedAmount(goal.id) + amountToAllocate,
                            }));
                          }
                        }}
                        className="btn btn-primary btn-sm"
                        disabled={
                          getRemainingToAllocate() <= 0 ||
                          getAllocatedAmount(goal.id) >= goal.targetAmount
                        }
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* Time to Goal */}
                  <div className="bg-base-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-base-content">
                          Maanden tot doel
                        </p>
                        <p className="text-lg font-semibold text-base-content">
                          {monthsToGoal === 0
                            ? "🎉 Bereikt!"
                            : monthsToGoal === Infinity
                            ? "❌ Onvoldoende spaargeld"
                            : `${monthsToGoal} maanden`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-base-content">
                          Verwacht klaar
                        </p>
                        <p className="text-sm font-medium text-base-content">
                          {targetDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Update Progress */}
                  <div>
                    <label className="label-text">Update gespaard bedrag</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder={goal.currentSaved.toString()}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          updateGoalProgress(goal.id, value);
                        }}
                        className="input input-bordered input-sm flex-1"
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget
                            .previousElementSibling as HTMLInputElement;
                          const value = parseFloat(input.value) || 0;
                          updateGoalProgress(goal.id, value);
                          input.value = "";
                        }}
                        className="btn btn-success btn-sm"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {goals.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-base-content mb-4">
            📊 Overzicht
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{goals.length}</p>
              <p className="text-sm text-base-content">Totaal Doelen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {
                  goals.filter(
                    (g) => getAllocatedAmount(g.id) >= g.targetAmount
                  ).length
                }
              </p>
              <p className="text-sm text-base-content">Bereikte Doelen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">
                {formatCurrency(getTotalAllocated())}
              </p>
              <p className="text-sm text-base-content">Totaal Gespaard</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
