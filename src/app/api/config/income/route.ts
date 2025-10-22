/**
 * Income Sources API
 */
import { NextResponse } from "next/server";
import { FinancialConfigService } from "@/services/financial-config-service";

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
    await service.deleteIncomeSource(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting income source:", error);
    return NextResponse.json(
      { error: "Failed to delete income source" },
      { status: 500 }
    );
  }
}
