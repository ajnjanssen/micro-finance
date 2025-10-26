import { NextResponse, NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { BUDGET_CATEGORIES } from "@/constants/categories";

export async function GET() {
  try {
    const configPath = path.join(
      process.cwd(),
      "data",
      "financial-config.json"
    );

    let configData: any = {};
    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      configData = JSON.parse(configContent);
    } catch (error) {
      // Config file doesn't exist yet, that's ok
    }

    const mappings = configData.budgetCategoryMappings || {};

    // Convert old string format to array format for consistency
    const normalizedMappings: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(mappings)) {
      if (typeof value === "string") {
        normalizedMappings[key] = [value as string];
      } else if (Array.isArray(value)) {
        normalizedMappings[key] = value;
      } else {
        normalizedMappings[key] = [];
      }
    }

    const allBudgetCategories = Object.values(BUDGET_CATEGORIES);
    const unmappedCategories = allBudgetCategories.filter(
      (category) =>
        !normalizedMappings[category] ||
        normalizedMappings[category].length === 0
    );

    return NextResponse.json({
      mappings: normalizedMappings,
      unmappedCategories,
    });
  } catch (error) {
    console.error("Error loading budget mappings:", error);
    return NextResponse.json(
      { error: "Failed to load budget mappings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { budgetCategory, transactionCategoryId } = await request.json();

    const configPath = path.join(
      process.cwd(),
      "data",
      "financial-config.json"
    );

    let configData: any = {};
    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      configData = JSON.parse(configContent);
    } catch (error) {
      // Config file doesn't exist yet, create new structure
      configData = {};
    }

    // Update the budget category mappings - support multiple categories per budget type
    configData.budgetCategoryMappings = configData.budgetCategoryMappings || {};

    // Convert old format (string) to new format (array) if needed
    if (typeof configData.budgetCategoryMappings[budgetCategory] === "string") {
      configData.budgetCategoryMappings[budgetCategory] = [
        configData.budgetCategoryMappings[budgetCategory],
      ];
    }

    // Initialize as array if not exists
    if (!Array.isArray(configData.budgetCategoryMappings[budgetCategory])) {
      configData.budgetCategoryMappings[budgetCategory] = [];
    }

    // Add category if not already in array
    if (
      !configData.budgetCategoryMappings[budgetCategory].includes(
        transactionCategoryId
      )
    ) {
      configData.budgetCategoryMappings[budgetCategory].push(
        transactionCategoryId
      );
    }

    configData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      configPath,
      JSON.stringify(configData, null, 2),
      "utf-8"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating budget mapping:", error);
    return NextResponse.json(
      { error: "Failed to update budget mapping" },
      { status: 500 }
    );
  }
}
