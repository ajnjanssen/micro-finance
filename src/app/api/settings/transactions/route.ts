import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    return NextResponse.json(financialData.transactions || []);
  } catch (error) {
    console.error("Error loading transactions:", error);
    return NextResponse.json(
      { error: "Failed to load transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newTransaction = await request.json();
    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    financialData.transactions = financialData.transactions || [];
    financialData.transactions.push(newTransaction);
    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    return NextResponse.json(newTransaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updateData = await request.json();
    const { id, ...updates } = updateData;

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    const transactionIndex = financialData.transactions.findIndex(
      (t: any) => t.id === id
    );

    if (transactionIndex === -1) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Update the transaction with new data
    financialData.transactions[transactionIndex] = {
      ...financialData.transactions[transactionIndex],
      ...updates,
    };

    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    return NextResponse.json(financialData.transactions[transactionIndex]);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}
