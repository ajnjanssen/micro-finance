import { type NextRequest, NextResponse } from "next/server";
import { BUDGET_CATEGORIES } from "@/constants/categories";
import { FinancialConfigService } from "@/services/financial-config-service";

function normalizeMappings(
  mappings: Record<string, string | string[]> | undefined,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(mappings ?? {}).map(([category, value]) => [
      category,
      typeof value === "string" ? [value] : value,
    ]),
  );
}

export async function GET() {
  try {
    const config = await FinancialConfigService.getInstance().loadConfig();
    const mappings = normalizeMappings(config.budgetCategoryMappings);
    const unmappedCategories = Object.values(BUDGET_CATEGORIES).filter(
      (category) => !mappings[category]?.length,
    );
    return NextResponse.json({ mappings, unmappedCategories });
  } catch (error) {
    console.error("Error loading budget mappings:", error);
    return NextResponse.json(
      { error: "Failed to load budget mappings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { budgetCategory, transactionCategoryId } = await request.json();
    if (
      typeof budgetCategory !== "string" ||
      typeof transactionCategoryId !== "string" ||
      !budgetCategory.trim() ||
      !transactionCategoryId.trim()
    ) {
      return NextResponse.json(
        { error: "Budget category and transaction category are required" },
        { status: 400 },
      );
    }

    const service = FinancialConfigService.getInstance();
    const config = await service.loadConfig();
    const mappings = normalizeMappings(config.budgetCategoryMappings);
    const categoryMappings = mappings[budgetCategory] ?? [];
    if (!categoryMappings.includes(transactionCategoryId)) {
      categoryMappings.push(transactionCategoryId);
    }
    config.budgetCategoryMappings = {
      ...mappings,
      [budgetCategory]: categoryMappings,
    };
    await service.saveConfig(config);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating budget mapping:", error);
    return NextResponse.json(
      { error: "Failed to update budget mapping" },
      { status: 500 },
    );
  }
}
