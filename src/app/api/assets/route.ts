import { NextRequest, NextResponse } from "next/server";
import { AssetsLiabilitiesService } from "@/services/assets-liabilities-service";
import type { Asset } from "@/types/assets-liabilities";

export async function GET() {
  try {
    const service = AssetsLiabilitiesService.getInstance();
    const assets = await service.getAssets();
    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error getting assets:", error);
    return NextResponse.json(
      { error: "Failed to get assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const service = AssetsLiabilitiesService.getInstance();
    const body = await request.json();

    const asset = await service.addAsset(body);
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Error creating asset:", error);
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const service = AssetsLiabilitiesService.getInstance();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }

    const asset = await service.updateAsset(id, updates);
    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const service = AssetsLiabilitiesService.getInstance();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }

    await service.deleteAsset(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}
