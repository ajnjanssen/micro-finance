/**
 * Budget Service Facade (NASA 50-line compliant)
 * Composes smaller budget modules into unified interface
 */

export { BudgetCalculator } from "./calculator";
export { ExpenseCategorizer } from "./categorizer";

// Re-export the main BudgetService for backward compatibility
export { BudgetService } from "../budget-service";
