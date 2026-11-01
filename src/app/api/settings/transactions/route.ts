import { type NextRequest, NextResponse } from "next/server";
import { addActivityLog } from "@/services/activity-log-service";
import { FinancialDataService } from "@/services/financial-data";
import type { Transaction } from "@/types/finance";

export async function GET() {
  try {
    const data = await FinancialDataService.getInstance().loadData();
    return NextResponse.json(data.transactions);
  } catch (error) {
    console.error("Error loading transactions:", error);
    return NextResponse.json(
      { error: "Failed to load transactions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const transaction = (await request.json()) as Omit<Transaction, "id">;
    const created =
      await FinancialDataService.getInstance().addTransaction(transaction);
    await addActivityLog("create", "transaction", {
      entityId: created.id,
      entityName: created.description || "Nieuwe transactie",
      description: `Transactie toegevoegd: ${created.amount} voor ${created.description || "onbekend"}`,
      metadata: {
        amount: created.amount,
        type: created.type,
        category: created.category,
      },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create transaction",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updateData = (await request.json()) as Partial<Transaction> & {
      id?: string;
    };
    const { id, ...updates } = updateData;
    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 },
      );
    }

    const transaction =
      await FinancialDataService.getInstance().updateTransaction(id, updates);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }
    await addActivityLog("update", "transaction", {
      entityId: transaction.id,
      entityName: transaction.description,
      description: "Transactie bijgewerkt",
      metadata: {
        amount: transaction.amount,
        category: transaction.category,
      },
    });
    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}
