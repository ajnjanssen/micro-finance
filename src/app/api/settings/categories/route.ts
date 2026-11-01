import { type NextRequest, NextResponse } from "next/server";
import { addActivityLog } from "@/services/activity-log-service";
import { FinancialDataService } from "@/services/financial-data";
import { insertUserCategory } from "@/services/supabase-financial-store";
import type { Category } from "@/types/finance";

export async function GET() {
  try {
    const data = await FinancialDataService.getInstance().loadData();
    return NextResponse.json(data.categories);
  } catch (error) {
    console.error("Error loading categories:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Category>;
    const name = body.name?.trim();
    if (!name || !body.type || !body.color) {
      return NextResponse.json(
        { error: "Name, type, and color are required" },
        { status: 400 },
      );
    }
    if (!["income", "expense", "transfer"].includes(body.type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const data = await FinancialDataService.getInstance().loadData();
    if (
      data.categories.some(
        (category) =>
          category.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 },
      );
    }

    const category: Category = {
      id:
        body.id ??
        `cat-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name,
      type: body.type,
      color: body.color,
    };
    await insertUserCategory(category);
    await addActivityLog("create", "category", {
      entityId: category.id,
      entityName: category.name,
      description: `Categorie aangemaakt: ${category.name}`,
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
