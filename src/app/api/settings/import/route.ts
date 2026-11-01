import { type NextRequest, NextResponse } from "next/server";
import { addActivityLog } from "@/services/activity-log-service";
import { FinancialDataService } from "@/services/financial-data";
import {
  insertUserAccount,
  insertUserCategory,
  updateUserAccount,
  updateUserCategory,
} from "@/services/supabase-financial-store";
import type { Account, Category } from "@/types/finance";

function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<Account>;
  return (
    typeof account.id === "string" &&
    typeof account.name === "string" &&
    ["checking", "savings", "crypto", "stocks", "debt", "other"].includes(
      account.type ?? "",
    ) &&
    typeof account.startingBalance === "number" &&
    Number.isFinite(account.startingBalance) &&
    typeof account.startDate === "string"
  );
}

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;
  const category = value as Partial<Category>;
  return (
    typeof category.id === "string" &&
    typeof category.name === "string" &&
    ["income", "expense", "transfer"].includes(category.type ?? "") &&
    typeof category.color === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const importData = (await request.json()) as {
      accounts?: unknown;
      categories?: unknown;
    };

    if (
      !Array.isArray(importData.accounts) ||
      !Array.isArray(importData.categories) ||
      !importData.accounts.every(isAccount) ||
      !importData.categories.every(isCategory)
    ) {
      return NextResponse.json(
        { error: "Invalid import data format" },
        { status: 400 },
      );
    }

    const currentData = await FinancialDataService.getInstance().loadData();
    const currentAccounts = new Map(
      currentData.accounts.map((account) => [account.id, account]),
    );
    const currentCategories = new Map(
      currentData.categories.map((category) => [category.id, category]),
    );
    for (const account of importData.accounts) {
      if (currentAccounts.has(account.id)) {
        await updateUserAccount(account.id, account);
      } else {
        await insertUserAccount(account);
      }
    }
    for (const category of importData.categories) {
      if (currentCategories.has(category.id)) {
        await updateUserCategory(category.id, category);
      } else {
        await insertUserCategory(category);
      }
    }

    // Log the activity
    await addActivityLog("create", "config", {
      entityId: "import",
      entityName: "Instellingen import",
      description: `Instellingen geïmporteerd (${importData.accounts?.length || 0} rekeningen, ${importData.categories?.length || 0} categorieën)`,
      metadata: {
        accountsCount: importData.accounts?.length || 0,
        categoriesCount: importData.categories?.length || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Settings imported successfully",
    });
  } catch (error) {
    console.error("Error importing settings:", error);
    return NextResponse.json(
      { error: "Failed to import settings" },
      { status: 500 },
    );
  }
}
