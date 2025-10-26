import { NextResponse } from "next/server";
import {
  getActivityLogs,
  clearActivityLogs,
} from "@/services/activity-log-service";

export async function GET() {
  try {
    const logs = await getActivityLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearActivityLogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing activity logs:", error);
    return NextResponse.json(
      { error: "Failed to clear activity logs" },
      { status: 500 }
    );
  }
}
