import { type NextRequest, NextResponse } from "next/server";
import { addActivityLog } from "@/services/activity-log-service";
import { FinancialDataService } from "@/services/financial-data";
import { deleteUserAccount } from "@/services/supabase-financial-store";
import type { Account } from "@/types/finance";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const updates = (await request.json()) as Partial<Account>;
    const account = await FinancialDataService.getInstance().updateAccount(
      id,
      updates,
    );
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await addActivityLog("update", "account", {
      entityId: account.id,
      entityName: account.name,
      description: `Rekening bijgewerkt: ${account.name}`,
      metadata: { type: account.type },
    });
    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const service = FinancialDataService.getInstance();
    const data = await service.loadData();
    const account = data.accounts.find((item) => item.id === id);
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const deleted = await deleteUserAccount(id);
    if (!deleted) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await addActivityLog("delete", "account", {
      entityId: account.id,
      entityName: account.name,
      description: `Rekening verwijderd: ${account.name}`,
      metadata: { type: account.type },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account; it may still be in use" },
      { status: 409 },
    );
  }
}
