export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  if (typeof date === "string") {
    // Parse YYYY-MM-DD format manually to avoid timezone issues
    const [year, month] = date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, 1);
    return dateObj.toLocaleDateString("nl-NL", {
      month: "short",
      year: "numeric",
    });
  }
  return new Date(date).toLocaleDateString("nl-NL");
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}
