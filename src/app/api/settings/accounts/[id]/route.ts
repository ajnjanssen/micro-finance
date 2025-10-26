import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { addActivityLog } from "@/services/activity-log-service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = id;
    const updatedAccount = await request.json();

    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    const accountIndex = financialData.accounts.findIndex(
      (acc: any) => acc.id === accountId
    );
    if (accountIndex === -1) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    financialData.accounts[accountIndex] = updatedAccount;
    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    // Log the activity
    await addActivityLog("update", "account", {
      entityId: updatedAccount.id,
      entityName: updatedAccount.name,
      description: `Rekening bijgewerkt: ${updatedAccount.name}`,
      metadata: {
        type: updatedAccount.type,
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
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
    const accountId = id;

    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    const accountIndex = financialData.accounts.findIndex(
      (acc: any) => acc.id === accountId
    );
    if (accountIndex === -1) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const deletedAccount = financialData.accounts[accountIndex];

    financialData.accounts.splice(accountIndex, 1);
    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    // Log the activity
    await addActivityLog("delete", "account", {
      entityId: deletedAccount.id,
      entityName: deletedAccount.name,
      description: `Rekening verwijderd: ${deletedAccount.name}`,
      metadata: {
        type: deletedAccount.type,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
