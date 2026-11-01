import { type NextRequest, NextResponse } from "next/server";
import { addActivityLog } from "@/services/activity-log-service";
import { FinancialDataService } from "@/services/financial-data";
import type { Account } from "@/types/finance";

export async function GET() {
  try {
    const data = await FinancialDataService.getInstance().loadData();
    return NextResponse.json(data.accounts);
  } catch (error) {
    console.error("Error loading accounts:", error);
    return NextResponse.json(
      { error: "Failed to load accounts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const account = (await request.json()) as Omit<Account, "id">;
    if (
      !account.name ||
      !account.type ||
      !Number.isFinite(account.startingBalance) ||
      !account.startDate
    ) {
      return NextResponse.json(
        { error: "Invalid account data" },
        { status: 400 },
      );
    }

    const created =
      await FinancialDataService.getInstance().addAccount(account);
    await addActivityLog("create", "account", {
      entityId: created.id,
      entityName: created.name,
      description: `Rekening aangemaakt: ${created.name}`,
      metadata: { type: created.type },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
