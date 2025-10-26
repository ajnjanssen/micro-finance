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

/**
 * Calculate the appropriate text color (white or black) based on background color
 * for optimal contrast and readability
 */
export function getContrastColor(backgroundColor: string): string {
  // Remove # if present
  const hex = backgroundColor.replace("#", "");

  // Parse hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white text for dark backgrounds, black text for light backgrounds
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
