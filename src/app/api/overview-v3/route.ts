import { NextRequest, NextResponse } from "next/server";
import { ProjectionEngine } from "@/services/projection-engine-v3";

export async function GET(request: NextRequest) {
  try {
    const engine = new ProjectionEngine();
    const overview = await engine.getCurrentMonthSummary();

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Error getting monthly overview:", error);
    return NextResponse.json(
      { error: "Failed to get overview" },
      { status: 500 }
    );
  }
}
