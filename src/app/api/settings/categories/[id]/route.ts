import { NextResponse, NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;
    const body = await request.json();
    const { name, type, color } = body;

    // Validate input
    if (!name || !type || !color) {
      return NextResponse.json(
        { error: "Name, type, and color are required" },
        { status: 400 }
      );
    }

    if (!["income", "expense", "transfer"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    // Find the category
    const categoryIndex = financialData.categories.findIndex(
      (c: any) => c.id === categoryId
    );

    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Update the category
    financialData.categories[categoryIndex] = {
      ...financialData.categories[categoryIndex],
      name,
      type,
      color,
    };

    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      category: financialData.categories[categoryIndex],
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;
    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    // Check if category exists
    const categoryIndex = financialData.categories.findIndex(
      (c: any) => c.id === categoryId
    );

    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category is being used by any transactions
    const categoryInUse = financialData.transactions.some(
      (t: any) => t.category === categoryId
    );

    if (categoryInUse) {
      return NextResponse.json(
        { error: "Cannot delete category that is being used by transactions" },
        { status: 400 }
      );
    }

    // Remove category
    financialData.categories.splice(categoryIndex, 1);
    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
