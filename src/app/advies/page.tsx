"use client";

import { useCallback, useEffect, useState } from "react";
import { FinancialPlan } from "@/components/advice/FinancialPlan";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import type { BudgetBreakdown } from "@/services/budget-service";
import {
  FinancialAdvisorService,
  type FinancialInsight,
} from "@/services/financial-advisor";
import { getSavingsGoalCurrentAmount } from "@/services/savings-goal-progress";
import type { FinancialData } from "@/types/finance";
import type { FinancialConfiguration } from "@/types/financial-config";
import type { SavingsGoal } from "@/types/savings-goals";

export default function AdviesPage() {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialPlanData, setFinancialPlanData] = useState<{
    config: FinancialConfiguration;
    financialData: FinancialData;
    goals: SavingsGoal[];
    budgetBreakdown: BudgetBreakdown;
  } | null>(null);
  const [filter, setFilter] = useState<
    "all" | "success" | "warning" | "error" | "info"
  >("all");

  const loadInsights = useCallback(async () => {
    try {
      const [configRes, financeRes, goalsRes, budgetRes] = await Promise.all([
        fetch("/api/config"),
        fetch("/api/finance"),
        fetch("/api/savings-goals"),
        fetch("/api/finance/budget/breakdown"),
      ]);

      const config: FinancialConfiguration = await configRes.json();
      const financialData: FinancialData = await financeRes.json();
      const goalsData = await goalsRes.json();
      const budgetData = await budgetRes.json();

      // Handle different response formats
      const loadedGoals: SavingsGoal[] = Array.isArray(goalsData)
        ? goalsData
        : goalsData.goals || [];
      const goals = loadedGoals.map((goal) => ({
        ...goal,
        currentAmount: getSavingsGoalCurrentAmount(
          goal,
          financialData.transactions,
          financialData.accounts,
          loadedGoals,
        ),
      }));

      setFinancialPlanData({
        config,
        financialData,
        goals,
        budgetBreakdown: budgetData as BudgetBreakdown,
      });

      const advisor = new FinancialAdvisorService(
        config,
        financialData,
        goals,
        budgetData,
      );
      const generatedInsights = advisor.generateInsights();

      setInsights(generatedInsights);
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "info":
        return "💡";
      default:
        return "ℹ️";
    }
  };

  const getAlertClass = (type: string) => {
    switch (type) {
      case "success":
        return "alert-success";
      case "warning":
        return "alert-warning";
      case "error":
        return "alert-error";
      case "info":
        return "alert-info";
      default:
        return "";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "budget":
        return "Budget";
      case "savings":
        return "Sparen";
      case "goals":
        return "Doelen";
      case "spending":
        return "Uitgaven";
      case "income":
        return "Inkomen";
      case "emergency":
        return "Noodfonds";
      case "advice":
        return "Financiële planning";
      default:
        return category;
    }
  };

  const filteredInsights =
    filter === "all" ? insights : insights.filter((i) => i.type === filter);

  const stats = {
    total: insights.length,
    success: insights.filter((i) => i.type === "success").length,
    warning: insights.filter((i) => i.type === "warning").length,
    error: insights.filter((i) => i.type === "error").length,
    info: insights.filter((i) => i.type === "info").length,
  };

  if (loading) {
    return (
      <PageLayout maxWidth="xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-base-300 rounded w-1/4"></div>
          <div className="h-64 bg-base-300 rounded"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="xl">
      <PageHeader
        title="💡 Financieel Advies"
        subtitle="Van actuele inzichten naar concrete keuzes voor je doelen en financiële toekomst"
      />

      {financialPlanData && (
        <FinancialPlan
          config={financialPlanData.config}
          financialData={financialPlanData.financialData}
          goals={financialPlanData.goals}
          budgetBreakdown={financialPlanData.budgetBreakdown}
          onSaved={loadInsights}
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`stat bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer ${
            filter === "all" ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="stat-title text-xs">Totaal</div>
          <div className="stat-value text-2xl">{stats.total}</div>
        </button>
        <button
          type="button"
          onClick={() => setFilter("success")}
          className={`stat bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer ${
            filter === "success" ? "ring-2 ring-success" : ""
          }`}
        >
          <div className="stat-title text-xs">✅ Goed</div>
          <div className="stat-value text-2xl text-success">
            {stats.success}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setFilter("warning")}
          className={`stat bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer ${
            filter === "warning" ? "ring-2 ring-warning" : ""
          }`}
        >
          <div className="stat-title text-xs">⚠️ Let op</div>
          <div className="stat-value text-2xl text-warning">
            {stats.warning}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setFilter("error")}
          className={`stat bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer ${
            filter === "error" ? "ring-2 ring-error" : ""
          }`}
        >
          <div className="stat-title text-xs">❌ Urgent</div>
          <div className="stat-value text-2xl text-error">{stats.error}</div>
        </button>
        <button
          type="button"
          onClick={() => setFilter("info")}
          className={`stat bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer ${
            filter === "info" ? "ring-2 ring-info" : ""
          }`}
        >
          <div className="stat-title text-xs">💡 Info</div>
          <div className="stat-value text-2xl text-info">{stats.info}</div>
        </button>
      </div>

      {/* Insights List */}
      {filteredInsights.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center">
            <h3 className="text-xl font-semibold">
              {filter === "all"
                ? "Geen inzichten beschikbaar"
                : `Geen ${
                    filter === "success"
                      ? "successen"
                      : filter === "warning"
                        ? "waarschuwingen"
                        : filter === "error"
                          ? "urgente zaken"
                          : "informatie"
                  }`}
            </h3>
            <p className="text-base-content/70">
              {filter === "all"
                ? "Voeg meer financiële data toe om inzichten te krijgen"
                : "Ga verder zo!"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Aanbevelingen en acties</h2>
            <p className="text-sm text-base-content/70">
              Gerangschikt op impact. Gebruik de acties om de onderliggende
              instellingen of doelen aan te passen.
            </p>
          </div>
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className={`alert ${getAlertClass(insight.type)} shadow-lg`}
            >
              <div className="w-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getIcon(insight.type)}</span>
                    <div className="">
                      <h3 className="font-bold text-lg">{insight.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="badge badge-sm">
                          {getCategoryLabel(insight.category)}
                        </span>
                        <span
                          className={`badge badge-sm ${
                            insight.impact === "high"
                              ? "badge-error"
                              : insight.impact === "medium"
                                ? "badge-warning"
                                : "badge-info"
                          }`}
                        >
                          {insight.impact === "high"
                            ? "Hoge impact"
                            : insight.impact === "medium"
                              ? "Gemiddelde impact"
                              : "Lage impact"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm mb-3">{insight.description}</p>
                {insight.recommendations &&
                  insight.recommendations.length > 0 && (
                    <div className="bg-base-100 rounded-lg p-3 mb-3">
                      <h4 className="font-semibold text-sm mb-2 text-base-content">
                        🎯 Concrete Actiestappen:
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {insight.recommendations.map((rec) => (
                          <li
                            key={rec}
                            className="flex items-start gap-2 text-base-content"
                          >
                            <span className="text-primary mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {insight.actionable && (
                  <a
                    href={insight.actionable.link}
                    className="btn btn-sm btn-outline"
                  >
                    {insight.actionable.label} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={loadInsights}
          className="btn btn-outline btn-sm"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            "🔄 Ververs inzichten"
          )}
        </button>
        <p className="text-xs text-base-content/50 mt-2">
          Inzichten worden automatisch gegenereerd op basis van je actuele
          financiële data
        </p>
      </div>
    </PageLayout>
  );
}
