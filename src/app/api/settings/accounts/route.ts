import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    return NextResponse.json(financialData.accounts || []);
  } catch (error) {
    console.error("Error loading accounts:", error);
    return NextResponse.json(
      { error: "Failed to load accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newAccount = await request.json();
    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    financialData.accounts = financialData.accounts || [];
    financialData.accounts.push(newAccount);
    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    return NextResponse.json(newAccount);
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
