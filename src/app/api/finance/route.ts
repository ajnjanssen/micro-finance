import { NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";

export async function GET() {
  try {
    const service = FinancialDataService.getInstance();
    const data = await service.loadData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading financial data:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const service = FinancialDataService.getInstance();

    if (body.type === "add-transaction") {
      const transaction = await service.addTransaction(body.transaction);
      return NextResponse.json(transaction);
    }

    if (body.type === "add-account") {
      const account = await service.addAccount(body.account);
      return NextResponse.json(account);
    }

    if (body.type === "reset-all") {
      // Reset to completely empty state
      await service.resetAllData();

      // Also reset financial configuration
      const { FinancialConfigService } = await import(
        "@/services/financial-config-service"
      );
      const configService = FinancialConfigService.getInstance();
      await configService.resetToDefault();

      return NextResponse.json({ success: true, message: "All data cleared" });
    }

    return NextResponse.json(
      { error: "Invalid request type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing POST request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const service = FinancialDataService.getInstance();

    if (body.type === "update-transaction") {
      const transaction = await service.updateTransaction(
        body.id,
        body.updates
      );
      if (!transaction) {
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(transaction);
    }

    return NextResponse.json(
      { error: "Invalid request type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing PUT request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json(
        { error: "Missing id or type parameter" },
        { status: 400 }
      );
    }

    const service = FinancialDataService.getInstance();

    if (type === "transaction") {
      const success = await service.deleteTransaction(id);
      if (!success) {
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid type parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing DELETE request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
