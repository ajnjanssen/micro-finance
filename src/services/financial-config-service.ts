/**
 * Financial Configuration Service
 *
 * CRUD operations for managing financial configuration.
 * This is the source of truth for projections.
 */

import fs from "node:fs/promises";
import path from "node:path";
import type {
  FinancialConfiguration,
  IncomeSource,
  RecurringExpense,
  OneTimeExpense,
  SavingsGoal,
  StartingBalance,
} from "@/types/financial-config";
import { generateId } from "@/types/financial-config";

export class FinancialConfigService {
  private static instance: FinancialConfigService;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(process.cwd(), "data", "financial-config.json");
  }

  static getInstance(): FinancialConfigService {
    if (!FinancialConfigService.instance) {
      FinancialConfigService.instance = new FinancialConfigService();
    }
    return FinancialConfigService.instance;
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<FinancialConfiguration> {
    try {
      const data = await fs.readFile(this.configPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, return default config
      return this.getDefaultConfig();
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config: FinancialConfiguration): Promise<void> {
    config.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Get default empty configuration
   */
  private getDefaultConfig(): FinancialConfiguration {
    return {
      version: "3.0",
      lastUpdated: new Date().toISOString(),
      startingBalance: {
        date: new Date().toISOString().split("T")[0],
        checking: 0,
        savings: 0,
      },
      incomeSources: [],
      recurringExpenses: [],
      oneTimeExpenses: [],
      savingsGoals: [],
      settings: {
        defaultCurrency: "EUR",
        projectionMonths: 36,
        conservativeMode: false,
      },
    };
  }

  // ============= STARTING BALANCE =============

  async setStartingBalance(balance: StartingBalance): Promise<void> {
    const config = await this.loadConfig();
    config.startingBalance = balance;
    await this.saveConfig(config);
  }

  async getStartingBalance(): Promise<StartingBalance> {
    const config = await this.loadConfig();
    return config.startingBalance;
  }

  // ============= INCOME SOURCES =============

  async addIncomeSource(
    source: Omit<IncomeSource, "id">
  ): Promise<IncomeSource> {
    const config = await this.loadConfig();
    const newSource: IncomeSource = {
      ...source,
      id: generateId(),
    };
    config.incomeSources.push(newSource);
    await this.saveConfig(config);
    return newSource;
  }

  async updateIncomeSource(
    id: string,
    updates: Partial<IncomeSource>
  ): Promise<void> {
    const config = await this.loadConfig();
    const index = config.incomeSources.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Income source ${id} not found`);

    config.incomeSources[index] = {
      ...config.incomeSources[index],
      ...updates,
    };
    await this.saveConfig(config);
  }

  async deleteIncomeSource(id: string): Promise<void> {
    const config = await this.loadConfig();
    config.incomeSources = config.incomeSources.filter((s) => s.id !== id);
    await this.saveConfig(config);
  }

  async getIncomeSources(activeOnly = false): Promise<IncomeSource[]> {
    const config = await this.loadConfig();
    return activeOnly
      ? config.incomeSources.filter((s) => s.isActive)
      : config.incomeSources;
  }

  // ============= RECURRING EXPENSES =============

  async addRecurringExpense(
    expense: Omit<RecurringExpense, "id">
  ): Promise<RecurringExpense> {
    const config = await this.loadConfig();
    const newExpense: RecurringExpense = {
      ...expense,
      id: generateId(),
    };
    config.recurringExpenses.push(newExpense);
    await this.saveConfig(config);
    return newExpense;
  }

  async updateRecurringExpense(
    id: string,
    updates: Partial<RecurringExpense>
  ): Promise<void> {
    const config = await this.loadConfig();
    const index = config.recurringExpenses.findIndex((e) => e.id === id);
    if (index === -1) throw new Error(`Recurring expense ${id} not found`);

    config.recurringExpenses[index] = {
      ...config.recurringExpenses[index],
      ...updates,
    };
    await this.saveConfig(config);
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    const config = await this.loadConfig();
    config.recurringExpenses = config.recurringExpenses.filter(
      (e) => e.id !== id
    );
    await this.saveConfig(config);
  }

  async getRecurringExpenses(activeOnly = false): Promise<RecurringExpense[]> {
    const config = await this.loadConfig();
    return activeOnly
      ? config.recurringExpenses.filter((e) => e.isActive)
      : config.recurringExpenses;
  }

  // ============= ONE-TIME EXPENSES =============

  async addOneTimeExpense(
    expense: Omit<OneTimeExpense, "id">
  ): Promise<OneTimeExpense> {
    const config = await this.loadConfig();
    const newExpense: OneTimeExpense = {
      ...expense,
      id: generateId(),
    };
    config.oneTimeExpenses.push(newExpense);
    await this.saveConfig(config);
    return newExpense;
  }

  async updateOneTimeExpense(
    id: string,
    updates: Partial<OneTimeExpense>
  ): Promise<void> {
    const config = await this.loadConfig();
    const index = config.oneTimeExpenses.findIndex((e) => e.id === id);
    if (index === -1) throw new Error(`One-time expense ${id} not found`);

    config.oneTimeExpenses[index] = {
      ...config.oneTimeExpenses[index],
      ...updates,
    };
    await this.saveConfig(config);
  }

  async deleteOneTimeExpense(id: string): Promise<void> {
    const config = await this.loadConfig();
    config.oneTimeExpenses = config.oneTimeExpenses.filter((e) => e.id !== id);
    await this.saveConfig(config);
  }

  async getOneTimeExpenses(unpaidOnly = false): Promise<OneTimeExpense[]> {
    const config = await this.loadConfig();
    return unpaidOnly
      ? config.oneTimeExpenses.filter((e) => !e.isPaid)
      : config.oneTimeExpenses;
  }

  // ============= SAVINGS GOALS =============

  async addSavingsGoal(goal: Omit<SavingsGoal, "id">): Promise<SavingsGoal> {
    const config = await this.loadConfig();
    const newGoal: SavingsGoal = {
      ...goal,
      id: generateId(),
    };
    config.savingsGoals.push(newGoal);
    await this.saveConfig(config);
    return newGoal;
  }

  async updateSavingsGoal(
    id: string,
    updates: Partial<SavingsGoal>
  ): Promise<void> {
    const config = await this.loadConfig();
    const index = config.savingsGoals.findIndex((g) => g.id === id);
    if (index === -1) throw new Error(`Savings goal ${id} not found`);

    config.savingsGoals[index] = {
      ...config.savingsGoals[index],
      ...updates,
    };
    await this.saveConfig(config);
  }

  async deleteSavingsGoal(id: string): Promise<void> {
    const config = await this.loadConfig();
    config.savingsGoals = config.savingsGoals.filter((g) => g.id !== id);
    await this.saveConfig(config);
  }

  async getSavingsGoals(activeOnly = false): Promise<SavingsGoal[]> {
    const config = await this.loadConfig();
    return activeOnly
      ? config.savingsGoals.filter((g) => g.isActive)
      : config.savingsGoals;
  }

  // ============= SUMMARY =============

  async getSummary() {
    const config = await this.loadConfig();

    const activeIncome = config.incomeSources
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + s.amount, 0);

    const activeExpenses = config.recurringExpenses
      .filter((e) => e.isActive)
      .reduce((sum, e) => sum + e.amount, 0);

    const unpaidOneTime = config.oneTimeExpenses
      .filter((e) => !e.isPaid)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      monthlyIncome: activeIncome,
      monthlyExpenses: activeExpenses,
      monthlyNet: activeIncome - activeExpenses,
      upcomingOneTime: unpaidOneTime,
      totalBalance:
        config.startingBalance.checking + config.startingBalance.savings,
      activeSources: config.incomeSources.filter((s) => s.isActive).length,
      activeExpenses: config.recurringExpenses.filter((e) => e.isActive).length,
      activeGoals: config.savingsGoals.filter((g) => g.isActive).length,
    };
  }
}
