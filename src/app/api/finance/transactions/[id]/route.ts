import { NextResponse, NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;
    const updates = await request.json();

    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    // Find the transaction
    const transactionIndex = financialData.transactions.findIndex(
      (t: any) => t.id === transactionId
    );

    if (transactionIndex === -1) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Update the transaction
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
