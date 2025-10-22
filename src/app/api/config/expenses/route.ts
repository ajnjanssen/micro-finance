/**
 * Recurring Expenses API
 */
import { NextResponse } from "next/server";
import { FinancialConfigService } from "@/services/financial-config-service";

export async function GET() {
  try {
    const service = FinancialConfigService.getInstance();
    const expenses = await service.getRecurringExpenses();
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error loading recurring expenses:", error);
    return NextResponse.json(
      { error: "Failed to load recurring expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const service = FinancialConfigService.getInstance();
    const newExpense = await service.addRecurringExpense(data);
    return NextResponse.json(newExpense);
  } catch (error) {
    console.error("Error adding recurring expense:", error);
    return NextResponse.json(
      { error: "Failed to add recurring expense" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    const service = FinancialConfigService.getInstance();
    await service.updateRecurringExpense(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating recurring expense:", error);
    return NextResponse.json(
      { error: "Failed to update recurring expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const service = FinancialConfigService.getInstance();
    await service.deleteRecurringExpense(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recurring expense:", error);
    return NextResponse.json(
      { error: "Failed to delete recurring expense" },
      { status: 500 }
    );
  }
}
