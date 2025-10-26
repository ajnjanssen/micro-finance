import { NextRequest, NextResponse } from "next/server";
import { AssetsLiabilitiesService } from "@/services/assets-liabilities-service";

export async function GET() {
  try {
    const service = AssetsLiabilitiesService.getInstance();
    const liabilities = await service.getLiabilities();
    return NextResponse.json(liabilities);
  } catch (error) {
    console.error("Error getting liabilities:", error);
    return NextResponse.json(
      { error: "Failed to get liabilities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const service = AssetsLiabilitiesService.getInstance();
    const body = await request.json();

    const liability = await service.addLiability(body);
    return NextResponse.json(liability, { status: 201 });
  } catch (error) {
    console.error("Error creating liability:", error);
    return NextResponse.json(
      { error: "Failed to create liability" },
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
        { error: "Liability ID is required" },
        { status: 400 }
      );
    }

    const liability = await service.updateLiability(id, updates);
    return NextResponse.json(liability);
  } catch (error) {
    console.error("Error updating liability:", error);
    return NextResponse.json(
      { error: "Failed to update liability" },
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
        { error: "Liability ID is required" },
        { status: 400 }
      );
    }

    await service.deleteLiability(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting liability:", error);
    return NextResponse.json(
      { error: "Failed to delete liability" },
      { status: 500 }
    );
  }
}
