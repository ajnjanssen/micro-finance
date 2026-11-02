import { NextResponse } from "next/server";
import { getActivityLogs } from "@/services/activity-log-service";
import { getAppSettings } from "@/services/app-settings-service";
import { FinancialConfigService } from "@/services/financial-config-service";
import { FinancialDataService } from "@/services/financial-data";
import { listUserSavingsGoals } from "@/services/supabase-savings-goal-store";

export async function GET() {
  try {
    const [
      financialData,
      financialConfig,
      savingsGoals,
      appSettings,
      activityLogs,
    ] = await Promise.all([
      FinancialDataService.getInstance().loadData(),
      FinancialConfigService.getInstance().loadConfig(),
      listUserSavingsGoals(),
      getAppSettings(),
      getActivityLogs(),
    ]);

    const exportData = {
      format: "micro-finance-backup",
      version: "2.0",
      exportedAt: new Date().toISOString(),
      financialData,
      financialConfig,
      savingsGoals: {
        goals: savingsGoals,
        lastUpdated: new Date().toISOString(),
      },
      appSettings,
      activityLog: {
        logs: activityLogs,
        version: "1.0",
      },
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Error exporting settings:", error);
    return NextResponse.json(
      { error: "Failed to export settings" },
      { status: 500 },
    );
  }
}
