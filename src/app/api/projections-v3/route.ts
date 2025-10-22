import { NextRequest, NextResponse } from "next/server";
import { ProjectionEngine } from "@/services/projection-engine-v3";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") || "36");

    const engine = new ProjectionEngine();
    const projections = await engine.generateProjections(months);

    return NextResponse.json(projections);
  } catch (error) {
    console.error("Error generating projections:", error);
    return NextResponse.json(
      { error: "Failed to generate projections" },
      { status: 500 }
    );
  }
}
