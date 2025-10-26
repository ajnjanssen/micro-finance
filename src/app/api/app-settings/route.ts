import { NextResponse } from "next/server";
import {
  getAppSettings,
  updateAppSettings,
} from "@/services/app-settings-service";

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch app settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const settings = await request.json();
    const updatedSettings = await updateAppSettings(settings);
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating app settings:", error);
    return NextResponse.json(
      { error: "Failed to update app settings" },
      { status: 500 }
    );
  }
}
