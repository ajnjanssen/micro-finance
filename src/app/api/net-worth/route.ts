import { NextResponse } from "next/server";
import { AssetsLiabilitiesService } from "@/services/assets-liabilities-service";

export async function GET() {
  try {
    const service = AssetsLiabilitiesService.getInstance();
    const summary = await service.getNetWorthSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error getting net worth:", error);
    return NextResponse.json(
      { error: "Failed to get net worth" },
      { status: 500 }
    );
  }
}
