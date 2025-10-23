/**
 * Category Service
 * Single source of truth for category normalization, mapping, and classification
 * All components MUST use this service - NO category logic in components
 */

import {
  BUDGET_CATEGORIES,
  DUTCH_TO_ENGLISH_CATEGORIES,
  CATEGORY_TO_BUDGET_TYPE,
  VARIABLE_CATEGORIES,
  FIXED_CATEGORIES,
  SAVINGS_TRANSACTION_PATTERNS,
  type BudgetCategory,
  type BudgetType,
} from "@/constants/categories";

export class CategoryService {
  private static instance: CategoryService;

  private constructor() {}

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  /**
   * Normalize a category name to standard budget category
   * Handles Dutch->English translation, case normalization, special characters
   *
   * @param category - Raw category name from user input or data
   * @returns Normalized budget category
   */
  normalizeCategory(category: string): string {
    if (!category) return BUDGET_CATEGORIES.SHOPPING;

    // Normalize: lowercase, remove special chars, trim spaces
    const normalized = category
      .toLowerCase()
      .replace(/[&\-_]/g, " ")
      .trim()
      .replace(/\s+/g, " ");

    // Check exact match in Dutch-to-English map
    if (DUTCH_TO_ENGLISH_CATEGORIES[normalized]) {
      return DUTCH_TO_ENGLISH_CATEGORIES[normalized];
    }

    // Check if normalized string contains any known keywords
    for (const [dutch, english] of Object.entries(
      DUTCH_TO_ENGLISH_CATEGORIES
    )) {
      if (normalized.includes(dutch) || dutch.includes(normalized)) {
        return english;
      }
    }

    // Check if it's already a known budget category
    const knownCategories = Object.values(BUDGET_CATEGORIES);
    if (knownCategories.includes(normalized as BudgetCategory)) {
      return normalized;
    }

    // Default: return original category (will be flagged as unmapped)
    return category;
  }

  /**
   * Get budget type (needs/wants/savings) for a category
   *
   * @param category - Budget category
   * @returns Budget type classification
   */
  getBudgetType(category: string): BudgetType {
    const normalized = this.normalizeCategory(category);
    return CATEGORY_TO_BUDGET_TYPE[normalized as BudgetCategory] || "wants";
  }

  /**
   * Check if category is variable (user-adjustable)
   *
   * @param category - Budget category
   * @returns True if variable, false if fixed
   */
  isVariableCategory(category: string): boolean {
    const normalized = this.normalizeCategory(category);
    return VARIABLE_CATEGORIES.includes(normalized as BudgetCategory);
  }

  /**
   * Check if category is fixed (recurring bills)
   *
   * @param category - Budget category
   * @returns True if fixed, false if variable
   */
  isFixedCategory(category: string): boolean {
    const normalized = this.normalizeCategory(category);
    return FIXED_CATEGORIES.includes(normalized as BudgetCategory);
  }

  /**
   * Check if a transaction is a savings-related transaction
   * (to avoid double-counting with savings goals)
   *
   * @param description - Transaction description
   * @returns True if this is a savings transaction
   */
  isSavingsTransaction(description: string): boolean {
    if (!description) return false;

    const desc = description.toLowerCase();
    const { keywords, shortKeyword, shortKeywordMaxLength } =
      SAVINGS_TRANSACTION_PATTERNS;

    // Check for exact keywords
    for (const keyword of keywords) {
      if (desc.includes(keyword)) return true;
    }

    // Check for short "sparen" descriptions
    if (desc.includes(shortKeyword) && desc.length < shortKeywordMaxLength) {
      return true;
    }

    return false;
  }

  /**
   * Check if a category name should be forced to groceries
   * (handles edge cases like "Boodschappen" that might be miscategorized)
   *
   * @param name - Expense or transaction name
   * @returns True if should be groceries
   */
  isGroceryItem(name: string): boolean {
    if (!name) return false;

    const normalized = name.toLowerCase();
    return (
      normalized.includes("boodschappen") ||
      normalized.includes("groceries") ||
      normalized.includes("supermarkt") ||
      normalized.includes("albert heijn") ||
      normalized.includes("jumbo") ||
      normalized.includes("lidl") ||
      normalized.includes("aldi")
    );
  }

  /**
   * Get unmapped categories (categories that don't match known patterns)
   *
   * @param category - Raw category name
   * @returns True if unmapped
   */
  isUnmappedCategory(category: string): boolean {
    const normalized = this.normalizeCategory(category);
    const knownCategories = Object.values(BUDGET_CATEGORIES);
    return !knownCategories.includes(normalized as BudgetCategory);
  }

  /**
   * Suggest budget categories based on transaction examples
   *
   * @param examples - Array of transaction descriptions
   * @returns Array of suggested category names
   */
  suggestCategories(examples: string[]): string[] {
    const suggestions: Set<string> = new Set();
    const exampleText = examples.join(" ").toLowerCase();

    // Check for grocery stores
    if (
      exampleText.includes("plus") ||
      exampleText.includes("jumbo") ||
      exampleText.includes("albert") ||
      exampleText.includes("lidl") ||
      exampleText.includes("aldi")
    ) {
      suggestions.add(BUDGET_CATEGORIES.GROCERIES);
    }

    // Check for gas stations
    if (
      exampleText.includes("shell") ||
      exampleText.includes("esso") ||
      exampleText.includes("bp") ||
      exampleText.includes("total")
    ) {
      suggestions.add(BUDGET_CATEGORIES.TRANSPORT);
    }

    // Check for streaming/entertainment
    if (
      exampleText.includes("netflix") ||
      exampleText.includes("spotify") ||
      exampleText.includes("disney")
    ) {
      suggestions.add(BUDGET_CATEGORIES.ENTERTAINMENT);
    }

    // Default suggestions
    if (suggestions.size === 0) {
      return [
        BUDGET_CATEGORIES.SHOPPING,
        BUDGET_CATEGORIES.FOOD,
        BUDGET_CATEGORIES.TRANSPORT,
      ];
    }

    return Array.from(suggestions);
  }
}
