import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

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
  private csvData: any[] = [];
  private patterns: ExpensePattern[] = [];

  static getInstance(): ExpensePredictionService {
    if (!ExpensePredictionService.instance) {
      ExpensePredictionService.instance = new ExpensePredictionService();
    }
    return ExpensePredictionService.instance;
  }

  parseDutchDate(dateString: string): string {
    // Convert YYYYMMDD to YYYY-MM-DD
    if (dateString.length === 8) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return dateString;
  }

  async loadCSVData(): Promise<void> {
    try {
      const csvDir = path.join(process.cwd(), "data", "realdata");

      // Find the CSV file (look for any .csv file in the realdata folder)
      const files = await fs.readdir(csvDir);
      const csvFile = files.find((f) => f.endsWith(".csv"));

      if (!csvFile) {
        console.error("No CSV file found in data/realdata/");
        this.csvData = [];
        return;
      }

      const csvPath = path.join(csvDir, csvFile);
      console.log(`Loading CSV: ${csvFile}`);

      const csvContent = await fs.readFile(csvPath, "utf-8");
      console.log(`CSV content length: ${csvContent.length} characters`);

      // Parse CSV with semicolon delimiter (Dutch format)
      this.csvData = parse(csvContent, {
        delimiter: ";",
        skip_empty_lines: true,
        from_line: 2, // Skip header
        columns: [
          "datum",
          "naam_omschrijving",
          "rekening",
          "tegenrekening",
          "code",
          "af_bij",
          "bedrag",
          "mutatiesoort",
          "mededelingen",
          "saldo_na_mutatie",
          "tag",
        ],
      });
      console.log(`Parsed ${this.csvData.length} CSV rows`);

      // Convert amounts to numbers and filter expenses
      this.csvData = this.csvData
        .map((row) => ({
          ...row,
          bedrag: parseFloat(row.bedrag.replace(",", ".")),
          datum: this.parseDutchDate(row.datum),
          isExpense: row.af_bij === "Af",
        }))
        .filter((row) => row.isExpense);

      console.log(
        `Loaded ${this.csvData.length} expense transactions from CSV`
      );
    } catch (error) {
      console.error("Error loading CSV data:", error);
      this.csvData = [];
    }
  }

  categorizeExpense(description: string, details: string): string {
    const desc = (description + " " + details).toLowerCase();

    if (
      desc.includes("mcdonald") ||
      desc.includes("kfc") ||
      desc.includes("tango") ||
      desc.includes("restaurant")
    ) {
      return "Eten & Drinken";
    }
    if (
      desc.includes("plus") ||
      desc.includes("flink") ||
      desc.includes("supermarkt") ||
      desc.includes("boodschappen")
    ) {
      return "Boodschappen";
    }
    if (
      desc.includes("kart") ||
      desc.includes("teamsport") ||
      desc.includes("limbo")
    ) {
      return "Vrije tijd";
    }
    if (desc.includes("belastingdienst") || desc.includes("belasting")) {
      return "Belastingen";
    }
    if (
      desc.includes("ov-chipkaart") ||
      desc.includes("tls") ||
      desc.includes("trein")
    ) {
      return "Vervoer";
    }
    if (
      desc.includes("netflix") ||
      desc.includes("github") ||
      desc.includes("abonnement")
    ) {
      return "Abonnementen";
    }
    if (desc.includes("vans") || desc.includes("schoenen")) {
      return "Kleding";
    }
    if (desc.includes("spaarrekening") || desc.includes("oranje")) {
      return "Sparen";
    }

    return "Overig";
  }

  analyzePatterns(): ExpensePattern[] {
    if (this.csvData.length === 0) return [];

    const categoryExpenses: {
      [category: string]: { amounts: number[]; dates: string[] };
    } = {};

    // Group expenses by category
    this.csvData.forEach((expense) => {
      const category = this.categorizeExpense(
        expense.naam_omschrijving,
        expense.mededelingen
      );
      if (!categoryExpenses[category]) {
        categoryExpenses[category] = { amounts: [], dates: [] };
      }
      categoryExpenses[category].amounts.push(expense.bedrag);
      categoryExpenses[category].dates.push(expense.datum);
    });

    const patterns: ExpensePattern[] = [];

    Object.entries(categoryExpenses).forEach(([category, data]) => {
      if (data.amounts.length < 2) return; // Need at least 2 transactions for pattern analysis

      const amounts = data.amounts;
      const dates = data.dates
        .map((d) => {
          try {
            return new Date(d);
          } catch (error) {
            console.error(`Invalid date: ${d}`);
            return new Date(); // fallback
          }
        })
        .filter((date) => !isNaN(date.getTime()));

      // Calculate average
      const averageAmount =
        amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;

      // Determine frequency
      const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
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
        amounts.reduce(
          (sum, amt) => sum + Math.pow(amt - averageAmount, 2),
          0
        ) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / averageAmount; // Coefficient of variation

      if (cv < 0.2) confidence += 0.2; // Very consistent
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
    monthsAhead: number = 12
  ): Promise<ExpensePrediction[]> {
    console.log("Starting expense prediction...");
    await this.loadCSVData();
    console.log(`CSV data loaded: ${this.csvData.length} records`);
    this.patterns = this.analyzePatterns();
    console.log(`Patterns analyzed: ${this.patterns.length} patterns found`);

    const predictions: ExpensePrediction[] = [];

    for (let i = 0; i < monthsAhead; i++) {
      const predictionDate = new Date();
      predictionDate.setMonth(predictionDate.getMonth() + i);

      const monthKey = `${predictionDate.getFullYear()}-${String(
        predictionDate.getMonth() + 1
      ).padStart(2, "0")}`;

      const monthlyPatterns = this.patterns.map((pattern) => {
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
          case "irregular":
            // For irregular expenses, predict based on historical frequency
            const daysSinceLast =
              (new Date().getTime() -
                new Date(pattern.lastOccurrence).getTime()) /
              (1000 * 60 * 60 * 24);
            const expectedOccurrences = 30 / daysSinceLast;
            monthlyAmount =
              pattern.averageAmount * Math.min(expectedOccurrences, 1);
            break;
        }

        return {
          ...pattern,
          predictedNextAmount: monthlyAmount,
        };
      });

      const totalPredictedExpense = monthlyPatterns.reduce(
        (sum, pattern) => sum + pattern.predictedNextAmount,
        0
      );
      const avgConfidence =
        monthlyPatterns.length > 0
          ? monthlyPatterns.reduce(
              (sum, pattern) => sum + pattern.confidence,
              0
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

  getPatterns(): ExpensePattern[] {
    return this.patterns;
  }
}
