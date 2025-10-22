import {
  FinancialData,
  Transaction,
  Account,
  BalanceProjection,
  MonthlyOverview,
} from "@/types/finance";
import fs from "fs/promises";
import path from "path";
import {
  enrichTransaction,
  validateTransaction,
  isDuplicate,
} from "./transaction-validator";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "financial-data.json");

export class FinancialDataService {
  private static instance: FinancialDataService;
  private data: FinancialData | null = null;

  static getInstance(): FinancialDataService {
    if (!FinancialDataService.instance) {
      FinancialDataService.instance = new FinancialDataService();
    }
    return FinancialDataService.instance;
  }

  async loadData(): Promise<FinancialData> {
    // Always reload from file to get latest changes
    try {
      const fileContent = await fs.readFile(DATA_FILE_PATH, "utf-8");
      this.data = JSON.parse(fileContent);
    } catch (error) {
      console.error("Error loading financial data:", error);
      // Als het bestand niet bestaat, maak een lege data structuur
      this.data = {
        accounts: [],
        transactions: [],
        categories: [],
        lastUpdated: new Date().toISOString(),
      };
    }
    return this.data!;
  }

  async saveData(): Promise<void> {
    if (!this.data) {
      throw new Error("No data to save");
    }

    this.data.lastUpdated = new Date().toISOString();

    try {
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error("Error saving financial data:", error);
      throw error;
    }
  }

  async addTransaction(
    transaction: Omit<Transaction, "id">
  ): Promise<Transaction> {
    const data = await this.loadData();

    // Validate transaction
    const validationErrors = validateTransaction(transaction, data.accounts);
    if (validationErrors.length > 0) {
      throw new Error(
        `Validation failed: ${validationErrors
          .map((e) => e.message)
          .join(", ")}`
      );
    }

    // Check for duplicates
    if (isDuplicate(transaction, data.transactions)) {
      throw new Error("Duplicate transaction detected");
    }

    // Enrich transaction with categorization, tags, etc.
    const enriched = enrichTransaction(transaction);

    const newTransaction: Transaction = {
      ...enriched,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    } as Transaction;

    data.transactions.push(newTransaction);

    // Sort transactions by date (newest first)
    data.transactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    await this.saveData();
    return newTransaction;
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null> {
    const data = await this.loadData();
    const transactionIndex = data.transactions.findIndex((t) => t.id === id);

    if (transactionIndex === -1) {
      return null;
    }

    const oldTransaction = data.transactions[transactionIndex];
    const updatedTransaction = { ...oldTransaction, ...updates };

    data.transactions[transactionIndex] = updatedTransaction;
    await this.saveData();
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const data = await this.loadData();
    const transactionIndex = data.transactions.findIndex((t) => t.id === id);

    if (transactionIndex === -1) {
      return false;
    }

    const transaction = data.transactions[transactionIndex];

    data.transactions.splice(transactionIndex, 1);
    await this.saveData();
    return true;
  }

  async addAccount(account: Omit<Account, "id">): Promise<Account> {
    const data = await this.loadData();
    const newAccount: Account = {
      ...account,
      id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    data.accounts.push(newAccount);
    await this.saveData();
    return newAccount;
  }

  async updateAccount(
    id: string,
    updates: Partial<Account>
  ): Promise<Account | null> {
    const data = await this.loadData();
    const accountIndex = data.accounts.findIndex((acc) => acc.id === id);

    if (accountIndex === -1) {
      return null;
    }

    data.accounts[accountIndex] = {
      ...data.accounts[accountIndex],
      ...updates,
    };
    await this.saveData();
    return data.accounts[accountIndex];
  }

  async getAccountBalance(accountId: string): Promise<number> {
    const data = await this.loadData();
    const account = data.accounts.find((a) => a.id === accountId);
    return account?.startingBalance || 0;
  }

  async getAccountBalances(): Promise<{ [accountId: string]: number }> {
    const data = await this.loadData();
    const balances: { [accountId: string]: number } = {};

    // Use manually set starting balances (NOT calculated from transactions)
    data.accounts.forEach((account) => {
      balances[account.id] = account.startingBalance || 0;
    });

    return balances;
  }

  async getTotalBalance(): Promise<number> {
    const balances = await this.getAccountBalances();
    return Object.values(balances).reduce(
      (total, balance) => total + balance,
      0
    );
  }

  async getBalanceByAccountType(): Promise<{ [type: string]: number }> {
    const data = await this.loadData();
    const balances = await this.getAccountBalances();
    const balancesByType: { [type: string]: number } = {};

    data.accounts.forEach((account) => {
      if (!balancesByType[account.type]) {
        balancesByType[account.type] = 0;
      }
      balancesByType[account.type] += balances[account.id] || 0;
    });

    return balancesByType;
  }

  async getMonthlyOverview(
    year: number,
    month: number
  ): Promise<MonthlyOverview> {
    const data = await this.loadData();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const today = new Date();
    const isCurrentMonth = today >= startDate && today <= endDate;

    const monthTransactions = data.transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const actualIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const actualExpenses = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    let totalIncome = actualIncome;
    let totalExpenses = actualExpenses;
    let projectedIncome = 0;
    let projectedExpenses = 0;

    // Top categorieën voor uitgaven
    const categoryTotals: { [category: string]: number } = {};
    monthTransactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        if (!categoryTotals[transaction.category]) {
          categoryTotals[transaction.category] = 0;
        }
        categoryTotals[transaction.category] += Math.abs(transaction.amount);
      });

    // For current month: Add projected expenses based on historical averages and recurring transactions
    if (isCurrentMonth) {
      // Get categories that have recurring transactions
      const recurringCategories = new Set(
        data.transactions
          .filter((t) => t.isRecurring && t.type === "expense")
          .map((t) => t.category)
      );

      // Calculate historical monthly averages for categories without recurring transactions
      const historicalMonthlyExpenses = this.calculateHistoricalMonthlyAverages(
        data,
        year,
        month
      );

      // Add projected amounts for categories that typically occur monthly (but not those with recurring transactions)
      Object.entries(historicalMonthlyExpenses).forEach(
        ([category, averageAmount]) => {
          if (averageAmount > 0 && !recurringCategories.has(category)) {
            // Only project if this category hasn't been paid this month yet
            const categoryPaidThisMonth = monthTransactions
              .filter((t) => t.type === "expense" && t.category === category)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            if (categoryPaidThisMonth < averageAmount * 0.5) {
              // If less than half the average is paid
              const projectedAmount = averageAmount - categoryPaidThisMonth;
              totalExpenses += projectedAmount;
              projectedExpenses += projectedAmount;

              // Add to category totals
              if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
              }
              categoryTotals[category] += projectedAmount;
            }
          }
        }
      );

      // Also add explicitly recurring transactions that haven't occurred yet
      const recurringTransactions = data.transactions.filter(
        (t) => t.isRecurring && t.recurringType === "monthly"
      );

      // Group by description and calculate average amount (to avoid double-counting)
      const recurringByDescription = new Map<
        string,
        { amounts: number[]; type: string; category: string }
      >();
      recurringTransactions.forEach((t) => {
        if (!recurringByDescription.has(t.description)) {
          recurringByDescription.set(t.description, {
            amounts: [],
            type: t.type,
            category: t.category,
          });
        }
        recurringByDescription
          .get(t.description)!
          .amounts.push(Math.abs(t.amount));
      });

      // For recurring items, calculate average amount and add if not paid this month
      recurringByDescription.forEach((data, description) => {
        const normalizedDesc = description.toLowerCase().trim();

        const alreadyPaidThisMonth = monthTransactions.some((t) => {
          const monthTxDesc = t.description.toLowerCase().trim();
          return (
            monthTxDesc.includes(normalizedDesc) ||
            normalizedDesc.includes(monthTxDesc)
          );
        });

        if (!alreadyPaidThisMonth) {
          // Calculate average amount from all occurrences
          let amount =
            data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;

          // For certain recurring expenses, use more typical amounts
          if (normalizedDesc.includes("patrimonium")) {
            // Use the higher amount (actual rent) instead of service fees
            amount = Math.max(...data.amounts);
          }

          if (data.type === "income") {
            totalIncome += amount;
            projectedIncome += amount;
          } else if (data.type === "expense") {
            totalExpenses += amount;
            projectedExpenses += amount;
            if (!categoryTotals[data.category]) {
              categoryTotals[data.category] = 0;
            }
            categoryTotals[data.category] += amount;
          }
        }
      });

      // Add conservative estimate for insurance costs
      const insuranceAvg = this.getCategoryMonthlyAverage(data, "insurance");
      if (insuranceAvg > 0) {
        const insurancePaidThisMonth = monthTransactions
          .filter((t) => t.type === "expense" && t.category === "insurance")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        if (insurancePaidThisMonth < insuranceAvg * 0.5) {
          const projectedInsurance = Math.min(
            insuranceAvg - insurancePaidThisMonth,
            500
          ); // Cap at reasonable amount
          totalExpenses += projectedInsurance;
          projectedExpenses += projectedInsurance;
          if (!categoryTotals["insurance"]) {
            categoryTotals["insurance"] = 0;
          }
          categoryTotals["insurance"] += projectedInsurance;
        }
      }
    }

    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      month: `${year}-${month.toString().padStart(2, "0")}`,
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      topCategories,
      actualIncome: isCurrentMonth ? actualIncome : undefined,
      actualExpenses: isCurrentMonth ? actualExpenses : undefined,
      projectedIncome: isCurrentMonth ? projectedIncome : undefined,
      projectedExpenses: isCurrentMonth ? projectedExpenses : undefined,
    };
  }

  async projectBalance(monthsAhead: number): Promise<BalanceProjection[]> {
    const data = await this.loadData();
    const currentBalances = await this.getAccountBalances();
    const projections: BalanceProjection[] = [];

    // Calculate average variable expenses from last 3 months
    // Exclude large one-time purchases (over €200) to get baseline spending
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentTransactions = data.transactions.filter(
      (t) =>
        new Date(t.date) >= threeMonthsAgo &&
        t.type === "expense" &&
        !t.isRecurring &&
        Math.abs(t.amount) <= 100 // Exclude purchases over €100 (likely one-time or irregular)
    );

    // Group by month to get proper average
    const expensesByMonth: { [key: string]: number } = {};
    recentTransactions.forEach((t) => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      expensesByMonth[monthKey] =
        (expensesByMonth[monthKey] || 0) + Math.abs(t.amount);
    });

    // Exclude the highest spending month (likely vacation/special occasions)
    // to get a more realistic baseline for regular months
    const monthEntries = Object.entries(expensesByMonth);
    if (monthEntries.length > 2) {
      // Sort by amount and exclude the highest
      monthEntries.sort((a, b) => a[1] - b[1]);
      monthEntries.pop(); // Remove highest month
    }

    const monthCount = monthEntries.length || 0;
    const totalExpenses = monthEntries.reduce((sum, [_, val]) => sum + val, 0);
    const avgVariableExpenses = monthCount > 0 ? totalExpenses / monthCount : 0;

    // Only use actual data - no assumptions or estimates
    const estimatedMonthlyExpenses = avgVariableExpenses;

    // Get recurring transactions
    const recurringTransactions = data.transactions.filter(
      (t) => t.isRecurring && t.recurringType
    );

    // Calculate net recurring monthly
    // Group by description to avoid double-counting multiple occurrences
    const recurringIncomeByDescription = new Map<string, number[]>();
    recurringTransactions
      .filter((t) => t.recurringType === "monthly" && t.type === "income")
      .forEach((t) => {
        const desc = t.description.toLowerCase().trim();
        if (!recurringIncomeByDescription.has(desc)) {
          recurringIncomeByDescription.set(desc, []);
        }
        recurringIncomeByDescription.get(desc)!.push(t.amount);
      });

    // For each recurring income source, take the average (or most recent)
    let monthlyRecurringIncome = 0;
    for (const amounts of recurringIncomeByDescription.values()) {
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      monthlyRecurringIncome += avg;
    }

    // Same for expenses - group by description to avoid double-counting
    const recurringExpensesByDescription = new Map<string, number[]>();
    recurringTransactions
      .filter((t) => t.recurringType === "monthly" && t.type === "expense")
      .forEach((t) => {
        const desc = t.description.toLowerCase().trim();
        if (!recurringExpensesByDescription.has(desc)) {
          recurringExpensesByDescription.set(desc, []);
        }
        recurringExpensesByDescription.get(desc)!.push(Math.abs(t.amount));
      });

    let monthlyRecurringExpenses = 0;
    for (const amounts of recurringExpensesByDescription.values()) {
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      monthlyRecurringExpenses += avg;
    }

    // Start with current balance
    let runningBalance = Object.values(currentBalances).reduce(
      (sum, balance) => sum + balance,
      0
    );

    for (let i = 0; i <= monthsAhead; i++) {
      const projectionDate = new Date();
      projectionDate.setMonth(projectionDate.getMonth() + i);
      const projectionYear = projectionDate.getFullYear();
      const projectionMonth = projectionDate.getMonth(); // 0-11

      if (i === 0) {
        // Current month - use actual balance
        const accountBalances: { [accountId: string]: number } = {};
        Object.entries(currentBalances).forEach(([accountId, balance]) => {
          accountBalances[accountId] = balance;
        });

        projections.push({
          date: projectionDate.toISOString().split("T")[0],
          totalBalance: runningBalance,
          accountBalances,
        });
      } else {
        // Future months - calculate realistic projection
        let monthlyChange = 0;

        // Add recurring income
        monthlyChange += monthlyRecurringIncome;

        // Subtract recurring expenses
        monthlyChange -= monthlyRecurringExpenses;

        // Subtract average variable expenses (only if we have actual data)
        monthlyChange -= estimatedMonthlyExpenses;

        // Check for any scheduled one-time transactions in this month
        const scheduledTransactions = data.transactions.filter((t) => {
          const txDate = new Date(t.date);
          return (
            txDate.getFullYear() === projectionYear &&
            txDate.getMonth() === projectionMonth &&
            txDate > new Date() // Only future transactions
          );
        });

        scheduledTransactions.forEach((tx) => {
          monthlyChange += tx.amount; // Already signed correctly
        });

        // Apply yearly transactions (like 13th month bonus)
        recurringTransactions
          .filter((t) => t.recurringType === "yearly")
          .forEach((transaction) => {
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getMonth();

            if (projectionMonth === transactionMonth) {
              monthlyChange += transaction.amount;
            }
          });

        // Update running balance
        runningBalance += monthlyChange;

        // Distribute across accounts (simplified - all in main account)
        const accountBalances: { [accountId: string]: number } = {};
        const mainAccountId = Object.keys(currentBalances)[0];
        if (mainAccountId) {
          accountBalances[mainAccountId] = runningBalance;
        }

        projections.push({
          date: projectionDate.toISOString().split("T")[0],
          totalBalance: runningBalance,
          accountBalances,
        });
      }
    }

    return projections;
  }

  private getCategoryMonthlyAverage(
    data: FinancialData,
    category: string
  ): number {
    const categoryTransactions = data.transactions.filter(
      (t) => t.type === "expense" && t.category === category
    );

    if (categoryTransactions.length === 0) {
      return 0;
    }

    const total = categoryTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    const months = new Set(
      categoryTransactions.map((t) => {
        const date = new Date(t.date);
        return `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
      })
    ).size;

    return months > 0 ? total / months : 0;
  }

  private calculateHistoricalMonthlyAverages(
    data: FinancialData,
    currentYear: number,
    currentMonth: number
  ): { [category: string]: number } {
    const currentMonthKey = `${currentYear}-${currentMonth
      .toString()
      .padStart(2, "0")}`;

    // Get all expense transactions except current month
    const historicalTransactions = data.transactions.filter(
      (t) =>
        t.type === "expense" &&
        `${new Date(t.date).getFullYear()}-${(new Date(t.date).getMonth() + 1)
          .toString()
          .padStart(2, "0")}` !== currentMonthKey
    );

    // Group by category and calculate monthly averages
    const categoryTotals: {
      [category: string]: { total: number; months: Set<string> };
    } = {};

    historicalTransactions.forEach((transaction) => {
      const category = transaction.category;
      const monthKey = `${new Date(transaction.date).getFullYear()}-${(
        new Date(transaction.date).getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}`;

      if (!categoryTotals[category]) {
        categoryTotals[category] = { total: 0, months: new Set() };
      }

      categoryTotals[category].total += Math.abs(transaction.amount);
      categoryTotals[category].months.add(monthKey);
    });

    // Calculate averages
    const averages: { [category: string]: number } = {};
    Object.entries(categoryTotals).forEach(([category, data]) => {
      const monthCount = data.months.size;
      averages[category] = monthCount > 0 ? data.total / monthCount : 0;
    });

    return averages;
  }

  async resetAllData(): Promise<void> {
    // Reset to completely empty state
    this.data = {
      accounts: [],
      transactions: [],
      categories: [],
      lastUpdated: new Date().toISOString(),
    };
    await this.saveData();
  }
}
