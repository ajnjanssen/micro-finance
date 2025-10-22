import { NextResponse, NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    return NextResponse.json(financialData.categories || []);
  } catch (error) {
    console.error("Error loading categories:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newCategory = await request.json();
    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    // Check if category already exists
    if (
      financialData.categories.some((c: any) => c.name === newCategory.name)
    ) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 }
      );
    }

    financialData.categories = financialData.categories || [];
    financialData.categories.push(newCategory);
    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
