import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";
import { projectInvestmentAccounts } from "@/services/investment-projection";

export async function GET(request: NextRequest) {
  try {
    const months = Number.parseInt(
      new URL(request.url).searchParams.get("months") || "60",
      10,
    );
    if (!Number.isInteger(months) || months < 1 || months > 120) {
      return NextResponse.json(
        { error: "Months must be an integer between 1 and 120" },
        { status: 400 },
      );
    }

    const data = await FinancialDataService.getInstance().loadData();
    const accounts = data.accounts.filter(
      (account) => account.type === "stocks",
    );
    const projections = projectInvestmentAccounts(
      data.accounts,
      data.transactions,
      months,
    );

    return NextResponse.json({
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        expectedAnnualReturn: account.expectedAnnualReturn ?? 0,
      })),
      projections,
    });
  } catch (error) {
    console.error("Error generating investment projections:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate investment projections",
      },
      { status: 500 },
    );
  }
}
