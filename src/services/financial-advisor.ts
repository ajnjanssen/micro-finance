/**
 * AI Financial Advisor Service
 * Analyzes financial data and provides personalized insights
 */

import type { FinancialConfiguration } from "@/types/financial-config";
import type { FinancialData, Transaction } from "@/types/finance";
import type { SavingsGoal } from "@/types/savings-goals";
import { BudgetService } from "./budget-service";

export interface FinancialInsight {
  id: string;
  type: "success" | "warning" | "info" | "error";
  category:
    | "budget"
    | "savings"
    | "goals"
    | "spending"
    | "income"
    | "emergency"
    | "advice";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionable?: {
    label: string;
    link: string;
  };
  recommendations?: string[]; // Specific action steps
}

export class FinancialAdvisorService {
  private config: FinancialConfiguration | null = null;
  private financialData: FinancialData | null = null;
  private goals: SavingsGoal[] = [];
  private budgetBreakdown: any = null; // Pre-calculated budget breakdown from API

  constructor(
    config: FinancialConfiguration,
    financialData: FinancialData,
    goals: SavingsGoal[],
    budgetBreakdown?: any // Optional: use pre-calculated breakdown from API
  ) {
    this.config = config;
    this.financialData = financialData;
    this.goals = goals;
    this.budgetBreakdown = budgetBreakdown;
  }

  /**
   * Generate all financial insights
   */
  generateInsights(): FinancialInsight[] {
    const insights: FinancialInsight[] = [];

    // Only use the new personalized advice that uses actual transaction data
    insights.push(...this.generatePersonalizedAdvice());

    // Sort by impact (high -> low)
    return insights.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }

  /**
   * Analyze budget adherence (50/30/20 rule)
   */
  private analyzeBudget(): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    if (!this.config || !this.financialData) return insights;

    const budgetPercentages = this.config.settings?.budgetPercentages || {
      needs: 0.5,
      wants: 0.3,
      savings: 0.2,
    };

    // Calculate total monthly income
    let totalIncome = 0;
    if (this.config.incomeSources && Array.isArray(this.config.incomeSources)) {
      this.config.incomeSources
        .filter((s) => s.isActive)
        .forEach((source) => {
          totalIncome += this.convertToMonthly(source.amount, source.frequency);
        });
    }

    // Calculate actual spending by budget type
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const spending = { needs: 0, wants: 0, savings: 0 };

    if (
      this.config.recurringExpenses &&
      Array.isArray(this.config.recurringExpenses)
    ) {
      this.config.recurringExpenses
        .filter((e) => e.isActive)
        .forEach((expense) => {
          const monthlyAmount = this.convertToMonthly(
            expense.amount,
            expense.frequency
          );
          if (expense.budgetType) {
            spending[expense.budgetType] += monthlyAmount;
          }
        });
    }

    // Analyze each category
    const targetNeeds = totalIncome * budgetPercentages.needs;
    const targetWants = totalIncome * budgetPercentages.wants;
    const targetSavings = totalIncome * budgetPercentages.savings;

    // Needs analysis
    if (spending.needs > targetNeeds * 1.1) {
      insights.push({
        id: "budget-needs-high",
        type: "warning",
        category: "budget",
        title: "Essentiële uitgaven te hoog",
        description: `Je besteedt €${spending.needs.toFixed(
          2
        )}/maand aan essentiële zaken, maar je budget is €${targetNeeds.toFixed(
          2
        )}. Dit is ${((spending.needs / targetNeeds - 1) * 100).toFixed(
          0
        )}% boven budget.`,
        impact: "high",
        actionable: {
          label: "Bekijk uitgaven",
          link: "/settings?tab=configure",
        },
      });
    } else if (spending.needs < targetNeeds * 0.8) {
      insights.push({
        id: "budget-needs-low",
        type: "success",
        category: "budget",
        title: "Goed bezig met essentiële uitgaven! 🎉",
        description: `Je houdt je essentiële uitgaven onder controle op €${spending.needs.toFixed(
          2
        )}/maand (budget: €${targetNeeds.toFixed(2)}).`,
        impact: "low",
      });
    }

    // Wants analysis
    if (spending.wants > targetWants * 1.2) {
      insights.push({
        id: "budget-wants-high",
        type: "warning",
        category: "budget",
        title: "Levensstijl uitgaven boven budget",
        description: `Je besteedt €${spending.wants.toFixed(
          2
        )}/maand aan levensstijl, maar je budget is €${targetWants.toFixed(
          2
        )}. Overweeg deze uitgaven te verminderen.`,
        impact: "medium",
        actionable: {
          label: "Bekijk uitgaven",
          link: "/settings?tab=configure",
        },
      });
    }

    return insights;
  }

  /**
   * Analyze savings goals progress
   */
  private analyzeGoals(): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    if (!this.goals || !Array.isArray(this.goals) || this.goals.length === 0) {
      insights.push({
        id: "goals-none",
        type: "info",
        category: "goals",
        title: "Geen spaardoelen ingesteld",
        description:
          "Stel spaardoelen in om je financiële toekomst beter te plannen.",
        impact: "medium",
        actionable: {
          label: "Maak een doel",
          link: "/spaardoelen",
        },
      });
      return insights;
    }

    this.goals.forEach((goal) => {
      if (goal.spentDate) return; // Skip completed goals

      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const remaining = goal.targetAmount - goal.currentAmount;
      const monthlyContribution = goal.monthlyContribution || 0;

      // Check if goal is on track
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const monthsLeft = Math.max(
          0,
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        if (monthsLeft > 0) {
          const requiredMonthly = remaining / monthsLeft;

          if (monthlyContribution < requiredMonthly * 0.9) {
            insights.push({
              id: `goal-behind-${goal.id}`,
              type: "warning",
              category: "goals",
              title: `Doel "${goal.name}" loopt achter`,
              description: `Je moet €${requiredMonthly.toFixed(
                2
              )}/maand sparen maar je spaart nu €${monthlyContribution.toFixed(
                2
              )}/maand. Verhoog met €${(
                requiredMonthly - monthlyContribution
              ).toFixed(2)}/maand om op schema te blijven.`,
              impact: "high",
              actionable: {
                label: "Bekijk doel",
                link: "/spaardoelen",
              },
            });
          } else if (monthlyContribution >= requiredMonthly) {
            insights.push({
              id: `goal-ontrack-${goal.id}`,
              type: "success",
              category: "goals",
              title: `Doel "${goal.name}" op schema! 🎯`,
              description: `Je bent ${progress.toFixed(
                0
              )}% van je doel en op schema om op tijd te bereiken.`,
              impact: "low",
            });
          }
        }
      }

      // Celebrate milestones
      if (progress >= 50 && progress < 75) {
        insights.push({
          id: `goal-milestone-${goal.id}`,
          type: "success",
          category: "goals",
          title: `Halverwege "${goal.name}"! 🎉`,
          description: `Je hebt al €${goal.currentAmount.toFixed(
            2
          )} gespaard van je €${goal.targetAmount.toFixed(2)} doel!`,
          impact: "low",
        });
      } else if (progress >= 75) {
        insights.push({
          id: `goal-almost-${goal.id}`,
          type: "success",
          category: "goals",
          title: `Bijna daar voor "${goal.name}"! 🚀`,
          description: `Nog maar €${remaining.toFixed(
            2
          )} te gaan! Je bent ${progress.toFixed(0)}% van je doel.`,
          impact: "low",
        });
      }
    });

    return insights;
  }

  /**
   * Analyze spending patterns
   */
  private analyzeSpending(): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    if (!this.financialData || !this.financialData.transactions)
      return insights;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentExpenses = this.financialData.transactions.filter(
      (t) =>
        t.type === "expense" && new Date(t.date) >= last30Days && t.completed
    );

    // Check for uncategorized transactions
    const uncategorized = recentExpenses.filter(
      (t) => !t.category || t.category === "uncategorized"
    );

    if (uncategorized.length > 5) {
      const totalUncategorized = uncategorized.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );
      insights.push({
        id: "spending-uncategorized",
        type: "warning",
        category: "spending",
        title: "Veel ongecategoriseerde uitgaven",
        description: `Je hebt ${
          uncategorized.length
        } ongecategoriseerde transacties (€${totalUncategorized.toFixed(
          2
        )}). Categoriseer deze voor beter inzicht.`,
        impact: "medium",
        actionable: {
          label: "Categoriseer",
          link: "/transactions",
        },
      });
    }

    // Analyze largest expenses
    const sortedExpenses = [...recentExpenses].sort(
      (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
    );
    if (sortedExpenses.length > 0) {
      const largest = sortedExpenses[0];
      const totalExpenses = recentExpenses.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );

      if (Math.abs(largest.amount) > totalExpenses * 0.3) {
        insights.push({
          id: "spending-large",
          type: "info",
          category: "spending",
          title: "Grote uitgave gedetecteerd",
          description: `"${largest.description}" (€${Math.abs(
            largest.amount
          ).toFixed(2)}) is ${(
            (Math.abs(largest.amount) / totalExpenses) *
            100
          ).toFixed(0)}% van je totale uitgaven deze maand.`,
          impact: "low",
        });
      }
    }

    return insights;
  }

  /**
   * Analyze income stability
   */
  private analyzeIncome(): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    if (!this.config) return insights;

    const activeIncome =
      this.config.incomeSources && Array.isArray(this.config.incomeSources)
        ? this.config.incomeSources.filter((s) => s.isActive)
        : [];

    if (activeIncome.length === 0) {
      insights.push({
        id: "income-none",
        type: "error",
        category: "income",
        title: "Geen inkomstenbronnen geconfigureerd",
        description:
          "Voeg je inkomstenbronnen toe voor nauwkeurige projecties.",
        impact: "high",
        actionable: {
          label: "Voeg inkomen toe",
          link: "/settings?tab=configure",
        },
      });
    } else if (activeIncome.length === 1) {
      insights.push({
        id: "income-single",
        type: "info",
        category: "income",
        title: "Eén inkomstenbron",
        description:
          "Je hebt één inkomstenbron. Overweeg extra inkomsten voor meer stabiliteit.",
        impact: "low",
      });
    } else {
      insights.push({
        id: "income-diverse",
        type: "success",
        category: "income",
        title: "Gediversifieerde inkomsten! 💰",
        description: `Je hebt ${activeIncome.length} actieve inkomstenbronnen, wat zorgt voor financiële stabiliteit.`,
        impact: "low",
      });
    }

    return insights;
  }

  /**
   * Analyze emergency fund
   */
  private analyzeEmergencyFund(): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    if (!this.config || !this.financialData) return insights;

    // Calculate monthly expenses
    let monthlyExpenses = 0;
    if (
      this.config.recurringExpenses &&
      Array.isArray(this.config.recurringExpenses)
    ) {
      this.config.recurringExpenses
        .filter((e) => e.isActive && e.isEssential)
        .forEach((expense) => {
          monthlyExpenses += this.convertToMonthly(
            expense.amount,
            expense.frequency
          );
        });
    }

    // Get savings account balance
    const savingsAccount = this.financialData.accounts.find(
      (a) => a.type === "savings"
    );
    let savingsBalance = savingsAccount?.startingBalance || 0;

    // Add completed transactions to savings
    if (
      this.financialData.transactions &&
      Array.isArray(this.financialData.transactions)
    ) {
      this.financialData.transactions
        .filter((t) => t.completed && t.accountId === savingsAccount?.id)
        .forEach((t) => {
          savingsBalance += t.amount;
        });
    }

    const monthsCovered = savingsBalance / monthlyExpenses;
    const recommendedMonths = 6;
    const recommended = monthlyExpenses * recommendedMonths;

    if (monthsCovered < 3) {
      insights.push({
        id: "emergency-low",
        type: "error",
        category: "emergency",
        title: "Noodfonds te laag ⚠️",
        description: `Je spaargeld (€${savingsBalance.toFixed(
          2
        )}) dekt ${monthsCovered.toFixed(
          1
        )} maanden uitgaven. Aanbevolen is 3-6 maanden (€${recommended.toFixed(
          2
        )}).`,
        impact: "high",
        actionable: {
          label: "Verhoog sparen",
          link: "/spaardoelen",
        },
      });
    } else if (monthsCovered < 6) {
      insights.push({
        id: "emergency-moderate",
        type: "warning",
        category: "emergency",
        title: "Noodfonds kan beter",
        description: `Je hebt ${monthsCovered.toFixed(
          1
        )} maanden uitgaven gespaard. Probeer 6 maanden (€${recommended.toFixed(
          2
        )}) te bereiken.`,
        impact: "medium",
        actionable: {
          label: "Verhoog sparen",
          link: "/spaardoelen",
        },
      });
    } else {
      insights.push({
        id: "emergency-good",
        type: "success",
        category: "emergency",
        title: "Uitstekend noodfonds! 🛡️",
        description: `Je hebt ${monthsCovered.toFixed(
          1
        )} maanden uitgaven gespaard (€${savingsBalance.toFixed(
          2
        )}). Goed bezig!`,
        impact: "low",
      });
    }

    return insights;
  }

  /**
   * Analyze savings rate
   */
  private analyzeSavingsRate(): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    if (!this.config) return insights;

    // Calculate total monthly income
    let totalIncome = 0;
    if (this.config.incomeSources && Array.isArray(this.config.incomeSources)) {
      this.config.incomeSources
        .filter((s) => s.isActive)
        .forEach((source) => {
          totalIncome += this.convertToMonthly(source.amount, source.frequency);
        });
    }

    // Calculate total monthly expenses
    let totalExpenses = 0;
    if (
      this.config.recurringExpenses &&
      Array.isArray(this.config.recurringExpenses)
    ) {
      this.config.recurringExpenses
        .filter((e) => e.isActive)
        .forEach((expense) => {
          totalExpenses += this.convertToMonthly(
            expense.amount,
            expense.frequency
          );
        });
    }

    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    if (savingsRate < 10) {
      insights.push({
        id: "savings-rate-low",
        type: "warning",
        category: "savings",
        title: "Lage spaarquote",
        description: `Je spaart ${savingsRate.toFixed(
          0
        )}% van je inkomen. Probeer minimaal 20% te bereiken voor een gezonde financiële toekomst.`,
        impact: "high",
        actionable: {
          label: "Bekijk uitgaven",
          link: "/settings?tab=configure",
        },
      });
    } else if (savingsRate >= 20) {
      insights.push({
        id: "savings-rate-good",
        type: "success",
        category: "savings",
        title: "Geweldige spaarquote! 💎",
        description: `Je spaart ${savingsRate.toFixed(
          0
        )}% van je inkomen (€${netIncome.toFixed(
          2
        )}/maand). Blijf zo doorgaan!`,
        impact: "low",
      });
    }

    return insights;
  }

  /**
   * Generate personalized advice based on user's financial situation
   */
  private generatePersonalizedAdvice(): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    if (!this.config || !this.financialData) return insights;

    // Calculate total income
    let totalIncome = 0;
    if (this.config.incomeSources && Array.isArray(this.config.incomeSources)) {
      this.config.incomeSources
        .filter((s) => s.isActive)
        .forEach((source) => {
          totalIncome += this.convertToMonthly(source.amount, source.frequency);
        });
    }

    // Use pre-calculated budget breakdown from API if available, otherwise calculate it
    let budgetBreakdown;
    if (this.budgetBreakdown) {
      budgetBreakdown = this.budgetBreakdown;
      console.log("Using pre-calculated budget breakdown from API");
    } else {
      // Fallback: calculate using BudgetService
      const budgetService = BudgetService.getInstance();
      const now = new Date();
      budgetBreakdown = budgetService.calculateBudgetBreakdown(
        totalIncome,
        this.config.recurringExpenses || [],
        this.financialData.transactions || [],
        this.goals || [],
        now // monthEndDate
      );
      console.log("Calculated budget breakdown using BudgetService");
    }

    // Calculate actual spending and net income
    const totalSpending =
      budgetBreakdown.needs.spent +
      budgetBreakdown.wants.spent +
      budgetBreakdown.savings.spent;

    const netIncome = totalIncome - totalSpending;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    // Essential expenses (needs) and wants spending
    const essentialExpenses = budgetBreakdown.needs.spent;
    const actualWantsSpending = budgetBreakdown.wants.spent;

    // Get savings balance (ONLY true emergency fund, exclude savings goals)
    const savingsAccount = this.financialData.accounts.find(
      (a) => a.type === "savings"
    );
    let totalSavingsBalance = savingsAccount?.startingBalance || 0;

    if (
      this.financialData.transactions &&
      Array.isArray(this.financialData.transactions)
    ) {
      this.financialData.transactions
        .filter((t) => t.completed && t.accountId === savingsAccount?.id)
        .forEach((t) => {
          totalSavingsBalance += t.amount;
        });
    }

    // Calculate how much is allocated to active savings goals
    let savingsGoalBalance = 0;
    if (this.goals && Array.isArray(this.goals)) {
      this.goals
        .filter((g) => !g.spentDate) // Only active goals
        .forEach((goal) => {
          savingsGoalBalance += goal.currentAmount;
        });
    }

    // Emergency fund is total savings minus what's allocated to goals
    const savingsBalance = totalSavingsBalance - savingsGoalBalance;

    // ADVICE 1: Increase savings rate if too low
    if (savingsRate < 20 && totalIncome > 0) {
      const targetSavings = totalIncome * 0.2;
      const needToReduce = targetSavings - netIncome;

      insights.push({
        id: "advice-increase-savings",
        type: "warning",
        category: "advice",
        title: "Verhoog je spaarquote naar 20%",
        description: `Je spaart nu €${netIncome.toFixed(
          2
        )}/maand (${savingsRate.toFixed(
          0
        )}%). Voor gezonde financiën moet dit €${targetSavings.toFixed(
          2
        )}/maand zijn.`,
        impact: "high",
        recommendations: [
          `Verlaag uitgaven met €${needToReduce.toFixed(2)}/maand`,
          `Actuele wants-uitgaven: €${actualWantsSpending.toFixed(
            2
          )}/maand - begin hier`,
          "Automatiseer sparen: zet direct €X apart bij salaris",
        ],
        actionable: {
          label: "Bekijk uitgaven",
          link: "/settings?tab=configure",
        },
      });
    }

    // ADVICE 2: Build emergency fund (if missing)

    // Check if user has an emergency fund savings goal with active contributions
    const emergencyFundGoal = this.goals?.find(
      (g) =>
        !g.spentDate &&
        (g.name.toLowerCase().includes("nood") ||
          g.name.toLowerCase().includes("emergency") ||
          g.name.toLowerCase().includes("buffer"))
    );

    // If emergency fund goal exists with monthly contribution, consider it as being built
    const hasActiveEmergencyFund =
      emergencyFundGoal &&
      emergencyFundGoal.monthlyContribution &&
      emergencyFundGoal.monthlyContribution > 0;

    // Calculate months covered including the emergency fund goal's current amount
    const totalEmergencyFund =
      savingsBalance + (emergencyFundGoal?.currentAmount || 0);
    const monthsCovered =
      essentialExpenses > 0 ? totalEmergencyFund / essentialExpenses : 0;

    // Only show advice if no active emergency fund goal exists
    if (!hasActiveEmergencyFund && monthsCovered < 6 && essentialExpenses > 0) {
      const targetAmount = essentialExpenses * 6;
      const shortfall = targetAmount - savingsBalance;

      insights.push({
        id: "advice-emergency-fund",
        type: monthsCovered < 3 ? "error" : "warning",
        category: "advice",
        title:
          monthsCovered < 3
            ? "Noodfonds ontbreekt - Bouw buffer op"
            : "Verhoog je noodfonds naar 6 maanden",
        description: `Je hebt €${savingsBalance.toFixed(
          2
        )} niet-gealloceerd gespaard (${monthsCovered.toFixed(
          1
        )} maanden). Doel: €${targetAmount.toFixed(
          2
        )} (6 maanden essentiële uitgaven à €${essentialExpenses.toFixed(
          2
        )}/maand).`,
        impact: monthsCovered < 3 ? "high" : "medium",
        recommendations: emergencyFundGoal
          ? [
              `Nog te sparen: €${shortfall.toFixed(2)}`,
              `Bij €${Math.ceil(shortfall / 12).toFixed(
                2
              )}/maand ben je er binnen 12 maanden`,
              "Stop tijdelijk met investeren tot noodfonds compleet is",
            ]
          : [
              `Maak een 'Noodfonds' spaardoel voor €${targetAmount.toFixed(2)}`,
              `Alloceer maandelijks €${Math.ceil(shortfall / 12).toFixed(
                2
              )} aan dit doel`,
              "Zo hou je overzicht wat écht beschikbaar is voor andere doelen",
              "Stop tijdelijk met investeren tot noodfonds compleet is",
            ],
        actionable: {
          label: emergencyFundGoal ? "Bekijk doel" : "Maak noodfonds doel",
          link: "/spaardoelen",
        },
      });
    }

    // ADVICE 3: Reduce non-essential spending if savings rate is negative
    if (netIncome < 0) {
      insights.push({
        id: "advice-reduce-spending-urgent",
        type: "error",
        category: "advice",
        title: "Je geeft meer uit dan je verdient",
        description: `Negatief saldo: €${netIncome.toFixed(
          2
        )}/maand. Dit is onhoudbaar en moet direct aangepakt worden.`,
        impact: "high",
        recommendations: [
          `Verlaag uitgaven met minimaal €${Math.abs(netIncome).toFixed(
            2
          )}/maand`,
          `Wants-uitgaven: €${actualWantsSpending.toFixed(
            2
          )} - schrap 50% hiervan`,
          "Review alle abonnementen en schrap wat je niet gebruikt",
          "Beperk restaurants/takeout tot 2x per maand",
        ],
        actionable: {
          label: "Bekijk uitgaven",
          link: "/settings?tab=configure",
        },
      });
    }

    // ADVICE 4: Optimize spending categories (wants too high)
    const budgetPercentages = this.config.settings?.budgetPercentages || {
      needs: 0.5,
      wants: 0.3,
      savings: 0.2,
    };

    const wantsTarget = totalIncome * budgetPercentages.wants;

    if (actualWantsSpending > wantsTarget * 1.2 && totalIncome > 0) {
      const excess = actualWantsSpending - wantsTarget;
      insights.push({
        id: "advice-reduce-wants",
        type: "warning",
        category: "advice",
        title: "Levensstijl uitgaven te hoog",
        description: `Je besteedt €${actualWantsSpending.toFixed(
          2
        )}/maand aan wants (30% regel = €${wantsTarget.toFixed(2)}).`,
        impact: "medium",
        recommendations: [
          `Verlaag wants met €${excess.toFixed(2)}/maand`,
          "Identificeer grootste wants-uitgaven en halveer deze",
          "Verplaats dit naar savings voor snellere doelbereik",
        ],
        actionable: {
          label: "Pas budget aan",
          link: "/transactions",
        },
      });
    }

    // ADVICE 5: Review goals and increase contributions if behind
    if (this.goals && Array.isArray(this.goals)) {
      const activeGoals = this.goals.filter((g) => !g.spentDate);

      activeGoals.forEach((goal) => {
        if (goal.deadline) {
          const deadline = new Date(goal.deadline);
          const now = new Date();
          const monthsLeft = Math.max(
            1,
            (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
          );
          const remaining = goal.targetAmount - goal.currentAmount;
          const requiredMonthly = remaining / monthsLeft;
          const currentContribution = goal.monthlyContribution || 0;

          if (
            currentContribution < requiredMonthly &&
            remaining > 0 &&
            monthsLeft > 0
          ) {
            const increase = requiredMonthly - currentContribution;
            insights.push({
              id: `advice-goal-${goal.id}`,
              type: "warning",
              category: "advice",
              title: `Verhoog bijdrage voor "${goal.name}"`,
              description: `Je moet €${requiredMonthly.toFixed(
                2
              )}/maand sparen maar doet nu €${currentContribution.toFixed(
                2
              )}/maand. Je loopt ${monthsLeft.toFixed(0)} maanden achter.`,
              impact: goal.priority === "high" ? "high" : "medium",
              recommendations: [
                `Verhoog maandelijkse bijdrage met €${increase.toFixed(2)}`,
                `Of: Verleng deadline met ${Math.ceil(
                  remaining / currentContribution - monthsLeft
                )} maanden`,
                `Of: Verlaag doelbedrag naar €${(
                  currentContribution * monthsLeft +
                  goal.currentAmount
                ).toFixed(2)}`,
              ],
              actionable: {
                label: "Pas doel aan",
                link: "/spaardoelen",
              },
            });
          }
        }
      });
    }

    // ADVICE 6: Invest surplus if emergency fund is complete AND have real surplus
    // Only show if we have reliable data (essentialExpenses must be reasonable)
    if (
      essentialExpenses > 500 && // Sanity check: needs must be at least €500/month
      monthsCovered >= 6 &&
      netIncome > 500 &&
      savingsBalance >= essentialExpenses * 6
    ) {
      const investableAmount = Math.min(netIncome * 0.7, netIncome - 200); // Keep some buffer

      // Check if user has an investment savings goal
      const hasInvestmentGoal = this.goals?.some(
        (g) =>
          !g.spentDate &&
          (g.name.toLowerCase().includes("investeren") ||
            g.name.toLowerCase().includes("beleggen") ||
            g.name.toLowerCase().includes("index") ||
            g.name.toLowerCase().includes("etf"))
      );

      insights.push({
        id: "advice-invest-surplus",
        type: "info",
        category: "advice",
        title: "Start met investeren",
        description: `Je noodfonds is compleet (€${savingsBalance.toFixed(
          2
        )}) en je hebt €${netIncome.toFixed(
          2
        )}/maand over na vaste lasten. Tijd om dit te laten groeien.`,
        impact: "medium",
        recommendations: hasInvestmentGoal
          ? [
              `Investeer €${investableAmount.toFixed(2)}/maand in indexfondsen`,
              "Kies brede index (VWRL of IWDA) voor lage kosten",
              "Automatiseer maandelijkse inleg",
            ]
          : [
              `Maak een 'Indexfondsen' spaardoel voor lange termijn`,
              `Alloceer maandelijks €${investableAmount.toFixed(
                2
              )} aan dit doel`,
              "Open beleggingsrekening bij DeGiro of IBKR",
              "Kies brede index (VWRL of IWDA) voor lage kosten",
            ],
        actionable: {
          label: hasInvestmentGoal ? "Bekijk doel" : "Maak beleggingsdoel",
          link: "/spaardoelen",
        },
      });
    }

    // ADVICE 7: Categorize transactions
    const uncategorizedCount =
      this.financialData.transactions?.filter(
        (t) => !t.category || t.category === "uncategorized"
      ).length || 0;

    if (uncategorizedCount > 10) {
      insights.push({
        id: "advice-categorize",
        type: "warning",
        category: "advice",
        title: "Categoriseer je transacties",
        description: `${uncategorizedCount} ongecategoriseerde transacties maken inzicht moeilijk.`,
        impact: "medium",
        recommendations: [
          "Categoriseer alle transacties",
          "Identificeer je top 3 uitgavenposten",
          "Stel limieten per categorie",
        ],
        actionable: {
          label: "Categoriseer",
          link: "/transactions",
        },
      });
    }

    // Always show at least SOME insights based on current state
    if (insights.length === 0) {
      // Show current financial snapshot as fallback
      insights.push({
        id: "advice-snapshot",
        type: "info",
        category: "advice",
        title: "Je financiële situatie",
        description: `Inkomen: €${totalIncome.toFixed(
          2
        )}/maand | Uitgaven: €${totalSpending.toFixed(
          2
        )}/maand | Netto: €${netIncome.toFixed(2)}/maand`,
        impact: "low",
        recommendations: [
          `Spaarquote: ${savingsRate.toFixed(0)}%`,
          `Essentiële uitgaven: €${essentialExpenses.toFixed(2)}/maand`,
          `Noodfonds: €${savingsBalance.toFixed(2)} (${monthsCovered.toFixed(
            1
          )} maanden)`,
          `Totaal spaarsaldo: €${totalSavingsBalance.toFixed(2)}`,
          `Toegewezen aan doelen: €${savingsGoalBalance.toFixed(2)}`,
        ],
      });
    }

    return insights;
  }

  /**
   * Convert any frequency to monthly amount
   */
  private convertToMonthly(amount: number, frequency: string): number {
    switch (frequency) {
      case "weekly":
        return (amount * 52) / 12;
      case "biweekly":
        return (amount * 26) / 12;
      case "monthly":
        return amount;
      case "quarterly":
        return amount / 3;
      case "yearly":
        return amount / 12;
      default:
        return amount;
    }
  }
}
