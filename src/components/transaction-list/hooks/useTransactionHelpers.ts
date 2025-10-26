import type { Transaction, Account, Category } from "@/types/finance";

export function useTransactionHelpers(
  accounts: Account[],
  categories: Category[]
) {
  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account ? account.name : "Onbekend";
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Onbekend";
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.color : "#6B7280";
  };

  const getCategoryDaisyUIClasses = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return "bg-base-300 text-base-content";

    const color = category.color.toLowerCase();

    // Handle DaisyUI semantic colors directly
    if (color === "primary") return "bg-primary text-primary-content";
    if (color === "secondary") return "bg-secondary text-secondary-content";
    if (color === "accent") return "bg-accent text-accent-content";
    if (color === "neutral") return "bg-neutral text-neutral-content";
    if (color === "info") return "bg-info text-info-content";
    if (color === "success") return "bg-success text-success-content";
    if (color === "warning") return "bg-warning text-warning-content";
    if (color === "error") return "bg-error text-error-content";

    // Legacy hex color support for existing categories
    if (color.includes("#ef4444") || color.includes("red"))
      return "bg-error text-error-content";
    if (color.includes("#f97316") || color.includes("orange"))
      return "bg-warning text-warning-content";
    if (color.includes("#eab308") || color.includes("yellow"))
      return "bg-warning text-warning-content";
    if (color.includes("#22c55e") || color.includes("green"))
      return "bg-success text-success-content";
    if (color.includes("#3b82f6") || color.includes("blue"))
      return "bg-info text-info-content";
    if (
      color.includes("#8b5cf6") ||
      color.includes("#a855f7") ||
      color.includes("purple")
    )
      return "bg-secondary text-secondary-content";
    if (color.includes("#ec4899") || color.includes("pink"))
      return "bg-accent text-accent-content";

    // For other colors, use primary as default
    return "bg-primary text-primary-content";
  };

  const getRecurringLabel = (transaction: Transaction) => {
    if (!transaction.isRecurring) return "";

    const labels = {
      monthly: "📅 Maandelijks",
      yearly: "📅 Jaarlijks",
      weekly: "📅 Wekelijks",
      daily: "📅 Dagelijks",
    };

    return labels[transaction.recurringType || "monthly"] || "📅 Terugkerend";
  };

  return {
    getAccountName,
    getCategoryName,
    getCategoryColor,
    getCategoryDaisyUIClasses,
    getRecurringLabel,
  };
}
