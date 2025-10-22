"use client";

import { useState, useEffect } from "react";

interface ExpensePattern {
  category: string;
  averageAmount: number;
  frequency: "daily" | "weekly" | "monthly" | "irregular";
  confidence: number;
  lastOccurrence: string;
  predictedNextAmount: number;
}

interface ExpensePrediction {
  month: string;
  predictedExpenses: ExpensePattern[];
  totalPredictedExpense: number;
  confidence: number;
}

export default function ExpensePredictions() {
  const [predictions, setPredictions] = useState<ExpensePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(0);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const response = await fetch("/api/finance/predictions?months=12");
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      console.error("Error loading predictions:", error);
      setPredictions([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "Dagelijks";
      case "weekly":
        return "Wekelijks";
      case "monthly":
        return "Maandelijks";
      case "irregular":
        return "Onregelmatig";
      default:
        return frequency;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "text-success";
    if (confidence >= 0.5) return "text-warning";
    return "text-error";
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-base-300 rounded w-1/3"></div>
          <div className="h-4 bg-base-300 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-base-300 rounded"></div>
            <div className="h-4 bg-base-300 rounded"></div>
            <div className="h-4 bg-base-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-base-content mb-4">
          Uitgave Voorspellingen
        </h2>
        <p className="text-base-content">
          Geen voorspellingen beschikbaar. Controleer of de CSV-gegevens correct
          zijn geladen.
        </p>
        <button onClick={loadPredictions} className="btn btn-primary mt-4">
          Opnieuw proberen
        </button>
      </div>
    );
  }

  const currentPrediction = predictions[selectedMonth];

  return (
    <div className="card">
      <div className="p-6 border-b border-base-300">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-base-content">
            Uitgave Voorspellingen
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-base-content">Maand:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="select select-bordered"
            >
              {Array.isArray(predictions) &&
                predictions.map((prediction, index) => (
                  <option key={prediction.month} value={index}>
                    {formatMonth(prediction.month)}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="text-sm text-primary font-medium">
              Totaal Voorspeld
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(currentPrediction.totalPredictedExpense)}
            </div>
          </div>
          <div className="bg-success/5 p-4 rounded-lg">
            <div className="text-sm text-success font-medium">
              Betrouwbaarheid
            </div>
            <div
              className={`text-2xl font-bold ${getConfidenceColor(
                currentPrediction.confidence
              )}`}
            >
              {Math.round(currentPrediction.confidence * 100)}%
            </div>
          </div>
          <div className="bg-secondary/5 p-4 rounded-lg">
            <div className="text-sm text-secondary font-medium">
              Aantal Categorieën
            </div>
            <div className="text-2xl font-bold text-secondary">
              {currentPrediction.predictedExpenses.length}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th className="text-base-content">Categorie</th>
              <th className="text-base-content">Frequentie</th>
              <th className="text-base-content">Gemiddeld</th>
              <th className="text-base-content">Voorspeld</th>
              <th className="text-base-content">Betrouwbaarheid</th>
            </tr>
          </thead>
          <tbody>
            {currentPrediction.predictedExpenses.map((expense, index) => (
              <tr key={index} className="hover">
                <td className="font-medium text-base-content">
                  {expense.category}
                </td>
                <td className="text-base-content">
                  {getFrequencyLabel(expense.frequency)}
                </td>
                <td className="text-base-content">
                  {formatCurrency(expense.averageAmount)}
                </td>
                <td className="font-semibold text-error">
                  {formatCurrency(expense.predictedNextAmount)}
                </td>
                <td>
                  <span
                    className={`font-medium ${getConfidenceColor(
                      expense.confidence
                    )}`}
                  >
                    {Math.round(expense.confidence * 100)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-base-200 border-t border-base-300">
        <div className="text-sm text-base-content">
          <p className="mb-2">
            <strong>Betrouwbaarheid uitleg:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="text-success font-medium">70%+</span> - Zeer
              betrouwbare voorspelling gebaseerd op consistente uitgavenpatronen
            </li>
            <li>
              <span className="text-warning font-medium">50-69%</span> -
              Betrouwbare voorspelling met enige variatie
            </li>
            <li>
              <span className="text-error font-medium">&lt;50%</span> - Minder
              betrouwbare voorspelling, mogelijk onregelmatige uitgaven
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
