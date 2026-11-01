import { type NextRequest, NextResponse } from "next/server";
import { addActivityLog } from "@/services/activity-log-service";
import { FinancialDataService } from "@/services/financial-data";
import type { Transaction } from "@/types/finance";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const transaction = (await request.json()) as Transaction;
    const updated = await FinancialDataService.getInstance().updateTransaction(
      id,
      transaction,
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const updates = (await request.json()) as Partial<Transaction>;
    const updated = await FinancialDataService.getInstance().updateTransaction(
      id,
      updates,
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error patching transaction:", error);
    return NextResponse.json(
      { error: "Failed to patch transaction" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const service = FinancialDataService.getInstance();
    const data = await service.loadData();
    const deleted = data.transactions.find(
      (transaction) => transaction.id === id,
    );
    if (!deleted) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }
    if (!(await service.deleteTransaction(id))) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }
    await addActivityLog("delete", "transaction", {
      entityId: deleted.id,
      entityName: deleted.description || "Transactie",
      description: `Transactie verwijderd: ${deleted.amount}`,
      metadata: { amount: deleted.amount, type: deleted.type },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 },
    );
  }
}
