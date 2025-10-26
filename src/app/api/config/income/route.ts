/**
 * Income Sources API
 */
import { NextResponse } from "next/server";
import { FinancialConfigService } from "@/services/financial-config-service";
import { addActivityLog } from "@/services/activity-log-service";

export async function GET() {
  try {
    const service = FinancialConfigService.getInstance();
    const sources = await service.getIncomeSources();
    return NextResponse.json(sources);
  } catch (error) {
    console.error("Error loading income sources:", error);
    return NextResponse.json(
      { error: "Failed to load income sources" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const service = FinancialConfigService.getInstance();
    const newSource = await service.addIncomeSource(data);

    // Log the activity
    await addActivityLog("create", "config", {
      entityId: newSource.id,
      entityName: newSource.name || "Inkomensbron",
      description: `Inkomensbron toegevoegd: ${newSource.name}`,
      metadata: {
        amount: newSource.amount,
        frequency: newSource.frequency,
      },
    });

    return NextResponse.json(newSource);
  } catch (error) {
    console.error("Error adding income source:", error);
    return NextResponse.json(
      { error: "Failed to add income source" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    const service = FinancialConfigService.getInstance();
    await service.updateIncomeSource(id, updates);

    // Log the activity
    await addActivityLog("update", "config", {
      entityId: id,
      entityName: updates.name || "Inkomensbron",
      description: `Inkomensbron bijgewerkt: ${updates.name || id}`,
      metadata: {
        amount: updates.amount,
        frequency: updates.frequency,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating income source:", error);
    return NextResponse.json(
      { error: "Failed to update income source" },
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
    const source = await service.getIncomeSources().then(sources => 
      sources.find(s => s.id === id)
    );
    await service.deleteIncomeSource(id);

    // Log the activity
    await addActivityLog("delete", "config", {
      entityId: id,
      entityName: source?.name || "Inkomensbron",
      description: `Inkomensbron verwijderd: ${source?.name || id}`,
      metadata: {
        amount: source?.amount,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting income source:", error);
    return NextResponse.json(
      { error: "Failed to delete income source" },
      { status: 500 }
    );
  }
}
