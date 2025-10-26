/**
 * Recurring Expenses API
 */
import { NextResponse } from "next/server";
import { FinancialConfigService } from "@/services/financial-config-service";
import { addActivityLog } from "@/services/activity-log-service";

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

    // Log the activity
    await addActivityLog("create", "config", {
      entityId: newExpense.id,
      entityName: newExpense.name || "Terugkerende uitgave",
      description: `Terugkerende uitgave toegevoegd: ${newExpense.name}`,
      metadata: {
        amount: newExpense.amount,
        frequency: newExpense.frequency,
        category: newExpense.category,
      },
    });

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

    // Log the activity
    await addActivityLog("update", "config", {
      entityId: id,
      entityName: updates.name || "Terugkerende uitgave",
      description: `Terugkerende uitgave bijgewerkt: ${updates.name || id}`,
      metadata: {
        amount: updates.amount,
        frequency: updates.frequency,
        category: updates.category,
      },
    });

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
    const expense = await service.getRecurringExpenses().then(expenses => 
      expenses.find(e => e.id === id)
    );
    await service.deleteRecurringExpense(id);

    // Log the activity
    await addActivityLog("delete", "config", {
      entityId: id,
      entityName: expense?.name || "Terugkerende uitgave",
      description: `Terugkerende uitgave verwijderd: ${expense?.name || id}`,
      metadata: {
        amount: expense?.amount,
        category: expense?.category,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recurring expense:", error);
    return NextResponse.json(
      { error: "Failed to delete recurring expense" },
      { status: 500 }
    );
  }
}
