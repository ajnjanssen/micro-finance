/**
 * Assets & Liabilities Service
 * Manages debts and assets, calculates net worth
 */

import fs from "fs/promises";
import path from "path";
import type {
  Asset,
  Debt,
  NetWorthSummary,
  DebtPaymentSchedule,
} from "@/types/assets-liabilities";
import type { FinancialConfiguration } from "@/types/financial-config";

export class AssetsLiabilitiesService {
  private static instance: AssetsLiabilitiesService;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(process.cwd(), "data", "financial-config.json");
  }

  static getInstance(): AssetsLiabilitiesService {
    if (!AssetsLiabilitiesService.instance) {
      AssetsLiabilitiesService.instance = new AssetsLiabilitiesService();
    }
    return AssetsLiabilitiesService.instance;
  }

  /**
   * Load configuration
   */
  private async loadConfig(): Promise<FinancialConfiguration> {
    const data = await fs.readFile(this.configPath, "utf-8");
    return JSON.parse(data);
  }

  /**
   * Save configuration
   */
  private async saveConfig(config: FinancialConfiguration): Promise<void> {
    config.lastUpdated = new Date().toISOString();
    await fs.writeFile(
      this.configPath,
      JSON.stringify(config, null, 2),
      "utf-8"
    );
  }

  /**
   * Get all assets
   */
  async getAssets(): Promise<Asset[]> {
    const config = await this.loadConfig();
    return config.assets || [];
  }

  /**
   * Get all liabilities (debts)
   */
  async getLiabilities(): Promise<Debt[]> {
    const config = await this.loadConfig();
    return config.liabilities || [];
  }

  /**
   * Get active liabilities only
   */
  async getActiveLiabilities(): Promise<Debt[]> {
    const liabilities = await this.getLiabilities();
    return liabilities.filter((debt) => debt.isActive);
  }

  /**
   * Add new asset
   */
  async addAsset(asset: Omit<Asset, "id" | "lastUpdated">): Promise<Asset> {
    const config = await this.loadConfig();
    if (!config.assets) config.assets = [];

    const newAsset: Asset = {
      ...asset,
      id: this.generateId(),
      lastUpdated: new Date().toISOString(),
    };

    config.assets.push(newAsset);
    await this.saveConfig(config);
    return newAsset;
  }

  /**
   * Add new liability (debt)
   */
  async addLiability(debt: Omit<Debt, "id" | "lastUpdated">): Promise<Debt> {
    const config = await this.loadConfig();
    if (!config.liabilities) config.liabilities = [];

    const newDebt: Debt = {
      ...debt,
      id: this.generateId(),
      lastUpdated: new Date().toISOString(),
    };

    config.liabilities.push(newDebt);
    await this.saveConfig(config);

    // Sync to recurring expenses
    await this.syncDebtsToRecurringExpenses();

    return newDebt;
  }

  /**
   * Update asset
   */
  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    const config = await this.loadConfig();
    if (!config.assets) throw new Error("No assets found");

    const index = config.assets.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Asset not found");

    config.assets[index] = {
      ...config.assets[index],
      ...updates,
      id, // Preserve ID
      lastUpdated: new Date().toISOString(),
    };

    await this.saveConfig(config);
    return config.assets[index];
  }

  /**
   * Update liability
   */
  async updateLiability(id: string, updates: Partial<Debt>): Promise<Debt> {
    const config = await this.loadConfig();
    if (!config.liabilities) throw new Error("No liabilities found");

    const index = config.liabilities.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Liability not found");

    config.liabilities[index] = {
      ...config.liabilities[index],
      ...updates,
      id, // Preserve ID
      lastUpdated: new Date().toISOString(),
    };

    await this.saveConfig(config);

    // Sync to recurring expenses
    await this.syncDebtsToRecurringExpenses();

    return config.liabilities[index];
  }

  /**
   * Delete asset
   */
  async deleteAsset(id: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config.assets) return;

    config.assets = config.assets.filter((a) => a.id !== id);
    await this.saveConfig(config);
  }

  /**
   * Delete liability
   */
  async deleteLiability(id: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config.liabilities) return;

    config.liabilities = config.liabilities.filter((d) => d.id !== id);

    // Also remove corresponding recurring expense
    if (!config.recurringExpenses) config.recurringExpenses = [];
    config.recurringExpenses = config.recurringExpenses.filter(
      (e) => e.id !== `debt-recurring-${id}`
    );

    await this.saveConfig(config);
  }

  /**
   * Sync debt payments to recurring expenses
   * Creates/updates recurring expense entries for each active debt
   */
  async syncDebtsToRecurringExpenses(): Promise<void> {
    const config = await this.loadConfig();
    if (!config.liabilities) return;
    if (!config.recurringExpenses) config.recurringExpenses = [];

    const activeDebts = config.liabilities.filter(
      (d) => d.isActive && d.monthlyPayment && d.monthlyPayment > 0
    );

    for (const debt of activeDebts) {
      const recurringId = `debt-recurring-${debt.id}`;
      const existingIndex = config.recurringExpenses.findIndex(
        (e) => e.id === recurringId
      );

      const recurringExpense = {
        id: recurringId,
        name: `Schuld: ${debt.name}`,
        category: "cat-debt-payments", // Use the standard category ID
        amount: debt.monthlyPayment || 0,
        frequency: "monthly" as const,
        startDate: debt.startDate,
        endDate: debt.endDate,
        isActive: true,
        isEssential: true,
        isVariable: false,
        budgetType: "needs" as const,
        notes: `Automatisch gegenereerd voor ${debt.type} schuld`,
      };

      if (existingIndex >= 0) {
        // Update existing
        config.recurringExpenses[existingIndex] = recurringExpense;
      } else {
        // Add new
        config.recurringExpenses.push(recurringExpense);
      }
    }

    // Remove recurring expenses for debts that no longer exist or are inactive
    const validDebtIds = new Set(
      activeDebts.map((d) => `debt-recurring-${d.id}`)
    );
    config.recurringExpenses = config.recurringExpenses.filter(
      (e) => !e.id.startsWith("debt-recurring-") || validDebtIds.has(e.id)
    );

    // Ensure budget mapping exists for debt payments
    if (!config.budgetCategoryMappings) {
      config.budgetCategoryMappings = {};
    }
    config.budgetCategoryMappings["debt-payments"] = "cat-debt-payments";

    await this.saveConfig(config);
  }

  /**
   * Calculate net worth summary
   */
  async getNetWorthSummary(): Promise<NetWorthSummary> {
    const assets = await this.getAssets();
    const liabilities = await this.getLiabilities();

    const activeAssets = assets.filter((a) => a.isActive);
    const activeLiabilities = liabilities.filter((d) => d.isActive);

    const totalAssets = activeAssets.reduce(
      (sum, asset) => sum + asset.currentValue,
      0
    );
    const totalLiabilities = activeLiabilities.reduce(
      (sum, debt) => sum + debt.currentBalance,
      0
    );

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      assets: activeAssets,
      liabilities: activeLiabilities,
    };
  }

  /**
   * Get debt payment schedule (for budget planning)
   */
  async getDebtPayments(): Promise<DebtPaymentSchedule[]> {
    const liabilities = await getActiveLiabilities();

    return liabilities
      .filter((debt) => debt.monthlyPayment && debt.monthlyPayment > 0)
      .map((debt) => ({
        debtId: debt.id,
        debtName: debt.name,
        monthlyPayment: debt.monthlyPayment || 0,
        totalRemaining: debt.currentBalance,
        payoffDate: debt.endDate,
        interestRate: debt.interestRate,
      }));
  }

  /**
   * Calculate total monthly debt payments
   */
  async getTotalMonthlyDebtPayments(): Promise<number> {
    const payments = await this.getDebtPayments();
    return payments.reduce((sum, p) => sum + p.monthlyPayment, 0);
  }

  /**
   * Update debt balance (after making payment)
   */
  async recordDebtPayment(
    debtId: string,
    paymentAmount: number,
    interestCharged: number = 0
  ): Promise<Debt> {
    const config = await this.loadConfig();
    if (!config.liabilities) throw new Error("No liabilities found");

    const debt = config.liabilities.find((d) => d.id === debtId);
    if (!debt) throw new Error("Debt not found");

    // Principal = payment - interest
    const principalPaid = paymentAmount - interestCharged;
    const newBalance = Math.max(0, debt.currentBalance - principalPaid);

    return await this.updateLiability(debtId, {
      currentBalance: newBalance,
      isActive: newBalance > 0, // Auto-mark as inactive when paid off
    });
  }

  /**
   * Project asset value (with appreciation/depreciation)
   */
  projectAssetValue(asset: Asset, monthsFromNow: number): number {
    if (!asset.appreciationRate && !asset.depreciationRate) {
      return asset.currentValue;
    }

    const rate = asset.appreciationRate || -(asset.depreciationRate || 0);
    const monthlyRate = rate / 12 / 100; // Convert annual % to monthly decimal

    return asset.currentValue * Math.pow(1 + monthlyRate, monthsFromNow);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Fix: getActiveLiabilities should be a method call
async function getActiveLiabilities(): Promise<Debt[]> {
  const service = AssetsLiabilitiesService.getInstance();
  return service.getActiveLiabilities();
}
