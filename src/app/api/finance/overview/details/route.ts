import { NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";

export async function GET() {
  try {
    const service = FinancialDataService.getInstance();
    const data = await service.loadData();

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get actual transactions for current month
    const monthTransactions = data.transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate >= startDate &&
        transactionDate <= endDate &&
        transaction.type === "expense"
      );
    });

    // Get recurring transactions for projections
    const recurringTransactions = data.transactions.filter(
      (t) =>
        t.isRecurring && t.recurringType === "monthly" && t.type === "expense"
    );

    // Group recurring by description to get latest amounts
    const recurringByDescription = new Map();
    recurringTransactions.forEach((t) => {
      const existing = recurringByDescription.get(t.description);
      if (!existing || new Date(t.date) > new Date(existing.date)) {
        recurringByDescription.set(t.description, t);
      }
    });

    // Build category details
    const categoryDetails: {
      [category: string]: {
        actual: any[];
        projected: any[];
      };
    } = {};

    // Add actual transactions
    monthTransactions.forEach((tx) => {
      if (!categoryDetails[tx.category]) {
        categoryDetails[tx.category] = { actual: [], projected: [] };
      }
      categoryDetails[tx.category].actual.push(tx);
    });

    // Add projected transactions (those not yet paid this month)
    recurringByDescription.forEach((recurringTx) => {
      const normalizedDesc = recurringTx.description.toLowerCase().trim();

      const alreadyPaidThisMonth = monthTransactions.some((t) => {
        const monthTxDesc = t.description.toLowerCase().trim();
        return (
          monthTxDesc.includes(normalizedDesc) ||
          normalizedDesc.includes(monthTxDesc)
        );
      });

      if (!alreadyPaidThisMonth) {
        if (!categoryDetails[recurringTx.category]) {
          categoryDetails[recurringTx.category] = { actual: [], projected: [] };
        }
        categoryDetails[recurringTx.category].projected.push({
          description: recurringTx.description,
          amount: recurringTx.amount,
          date: recurringTx.date,
          isProjected: true,
        });
      }
    });

    // Remove duplicate projected transactions (e.g., old and new Patrimonium)
    // Keep only the most recent one for similar descriptions
    Object.values(categoryDetails).forEach((details) => {
      // Group projected by similar descriptions
      const projectedGroups = new Map<string, any[]>();

      details.projected.forEach((proj) => {
        const baseDesc = proj.description
          .toLowerCase()
          .replace(/chr\.|woningstichting|b\.v\.|nv|n\.v\./gi, "")
          .trim();

        if (!projectedGroups.has(baseDesc)) {
          projectedGroups.set(baseDesc, []);
        }
        projectedGroups.get(baseDesc)!.push(proj);
      });

      // Keep only the most recent from each group
      details.projected = Array.from(projectedGroups.values()).map((group) => {
        return group.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
      });
    });

    // Sort actual transactions by date (newest first)
    Object.values(categoryDetails).forEach((details) => {
      details.actual.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    return NextResponse.json(categoryDetails);
  } catch (error) {
    console.error("Error getting category details:", error);
    return NextResponse.json(
      { error: "Failed to get category details" },
      { status: 500 }
    );
  }
}
