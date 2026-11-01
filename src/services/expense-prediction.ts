import { FinancialDataService } from "@/services/financial-data";
import type { Transaction } from "@/types/finance";

export interface ExpensePattern {
  category: string;
  averageAmount: number;
  frequency: "daily" | "weekly" | "monthly" | "irregular";
  confidence: number; // 0-1
  lastOccurrence: string;
  predictedNextAmount: number;
}

export interface ExpensePrediction {
  month: string; // YYYY-MM
  predictedExpenses: ExpensePattern[];
  totalPredictedExpense: number;
  confidence: number;
}

export class ExpensePredictionService {
  private static instance: ExpensePredictionService;

  static getInstance(): ExpensePredictionService {
    if (!ExpensePredictionService.instance) {
      ExpensePredictionService.instance = new ExpensePredictionService();
    }
    return ExpensePredictionService.instance;
  }

  analyzePatterns(transactions: Transaction[]): ExpensePattern[] {
    const categoryExpenses: {
      [category: string]: { amounts: number[]; dates: string[] };
    } = {};

    transactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((expense) => {
        const category = expense.category || "Overig";
        if (!categoryExpenses[category]) {
          categoryExpenses[category] = { amounts: [], dates: [] };
        }
        categoryExpenses[category].amounts.push(Math.abs(expense.amount));
        categoryExpenses[category].dates.push(expense.date);
      });

    const patterns: ExpensePattern[] = [];

    Object.entries(categoryExpenses).forEach(([category, data]) => {
      if (data.amounts.length < 2) return; // Need at least 2 transactions for pattern analysis

      const amounts = data.amounts;
      const dates = data.dates
        .map((date) => new Date(date))
        .filter((date) => Number.isFinite(date.getTime()));

      // Calculate average
      const averageAmount =
        amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;

      // Determine frequency
      const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
      if (sortedDates.length < 2) return;
      const intervals: number[] = [];

      for (let i = 1; i < sortedDates.length; i++) {
        const diffTime =
          sortedDates[i].getTime() - sortedDates[i - 1].getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        intervals.push(diffDays);
      }

      const avgInterval =
        intervals.length > 0
          ? intervals.reduce((sum, int) => sum + int, 0) / intervals.length
          : 30;

      let frequency: "daily" | "weekly" | "monthly" | "irregular";
      let confidence: number;

      if (avgInterval <= 2) {
        frequency = "daily";
        confidence = 0.8;
      } else if (avgInterval <= 10) {
        frequency = "weekly";
        confidence = 0.7;
      } else if (avgInterval <= 40) {
        frequency = "monthly";
        confidence = 0.6;
      } else {
        frequency = "irregular";
        confidence = 0.3;
      }

      // Adjust confidence based on consistency
      const variance =
        amounts.reduce((sum, amt) => sum + (amt - averageAmount) ** 2, 0) /
        amounts.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / averageAmount; // Coefficient of variation

      if (cv < 0.2)
        confidence += 0.2; // Very consistent
      else if (cv > 0.5) confidence -= 0.2; // Very variable

      confidence = Math.max(0.1, Math.min(0.9, confidence));

      patterns.push({
        category,
        averageAmount,
        frequency,
        confidence,
        lastOccurrence: sortedDates[sortedDates.length - 1]
          .toISOString()
          .split("T")[0],
        predictedNextAmount: averageAmount,
      });
    });

    return patterns.sort((a, b) => b.averageAmount - a.averageAmount);
  }

  async predictMonthlyExpenses(
    monthsAhead: number = 12,
  ): Promise<ExpensePrediction[]> {
    if (!Number.isInteger(monthsAhead) || monthsAhead < 1 || monthsAhead > 36) {
      throw new Error("monthsAhead must be an integer from 1 to 36.");
    }
    const data = await FinancialDataService.getInstance().loadData();
    const today = new Date();
    const historicalExpenses = data.transactions.filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.completed !== false &&
        transaction.date <= today.toISOString().slice(0, 10),
    );
    const patterns = this.analyzePatterns(historicalExpenses);

    const predictions: ExpensePrediction[] = [];

    for (let i = 0; i < monthsAhead; i++) {
      const predictionDate = new Date();
      predictionDate.setMonth(predictionDate.getMonth() + i);

      const monthKey = `${predictionDate.getFullYear()}-${String(
        predictionDate.getMonth() + 1,
      ).padStart(2, "0")}`;

      const monthlyPatterns = patterns.map((pattern) => {
        let monthlyAmount = 0;

        switch (pattern.frequency) {
          case "daily":
            monthlyAmount = pattern.averageAmount * 30;
            break;
          case "weekly":
            monthlyAmount = pattern.averageAmount * 4.3;
            break;
          case "monthly":
            monthlyAmount = pattern.averageAmount;
            break;
          case "irregular": {
            // For irregular expenses, predict based on historical frequency
            const daysSinceLast =
              (Date.now() - new Date(pattern.lastOccurrence).getTime()) /
              (1000 * 60 * 60 * 24);
            const expectedOccurrences = 30 / daysSinceLast;
            monthlyAmount =
              pattern.averageAmount * Math.min(expectedOccurrences, 1);
            break;
          }
        }

        return {
          ...pattern,
          predictedNextAmount: monthlyAmount,
        };
      });

      const totalPredictedExpense = monthlyPatterns.reduce(
        (sum, pattern) => sum + pattern.predictedNextAmount,
        0,
      );
      const avgConfidence =
        monthlyPatterns.length > 0
          ? monthlyPatterns.reduce(
              (sum, pattern) => sum + pattern.confidence,
              0,
            ) / monthlyPatterns.length
          : 0;

      predictions.push({
        month: monthKey,
        predictedExpenses: monthlyPatterns,
        totalPredictedExpense,
        confidence: avgConfidence,
      });
    }

    return predictions;
  }
}
