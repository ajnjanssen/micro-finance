/**
 * Configuration API - Get all configuration
 */
import { NextResponse } from "next/server";
import { FinancialConfigService } from "@/services/financial-config-service";

export async function GET() {
  try {
    const service = FinancialConfigService.getInstance();
    const config = await service.loadConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error loading config:", error);
    return NextResponse.json(
      { error: "Failed to load configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const updates = await request.json();
    const service = FinancialConfigService.getInstance();
    const config = await service.loadConfig();

    // Merge updates
    const updated = { ...config, ...updates };
    await service.saveConfig(updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}
