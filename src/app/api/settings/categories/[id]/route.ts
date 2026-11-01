import { type NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";
import {
  deleteUserCategory,
  updateUserCategory,
} from "@/services/supabase-financial-store";
import type { Category } from "@/types/finance";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Partial<Category>;
    if (!body.name || !body.type || !body.color) {
      return NextResponse.json(
        { error: "Name, type, and color are required" },
        { status: 400 },
      );
    }
    if (!["income", "expense", "transfer"].includes(body.type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const category = await updateUserCategory(id, body);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await FinancialDataService.getInstance().loadData();
    if (!data.categories.some((category) => category.id === id)) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }
    if (data.transactions.some((transaction) => transaction.category === id)) {
      return NextResponse.json(
        { error: "Cannot delete category that is being used by transactions" },
        { status: 400 },
      );
    }
    if (!(await deleteUserCategory(id))) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
