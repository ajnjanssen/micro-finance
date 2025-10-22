import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = id;
    const updatedTransaction = await request.json();

    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    const transactionIndex = financialData.transactions.findIndex(
      (tx: any) => tx.id === transactionId
    );
    if (transactionIndex === -1) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    financialData.transactions[transactionIndex] = updatedTransaction;
    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = id;

    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    const transactionIndex = financialData.transactions.findIndex(
      (tx: any) => tx.id === transactionId
    );
    if (transactionIndex === -1) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    financialData.transactions.splice(transactionIndex, 1);
    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
