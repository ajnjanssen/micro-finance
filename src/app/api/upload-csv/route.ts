import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { importCSVTransactions } from "../../../../scripts/import-csv";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("csv") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check if it's a CSV file
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV" },
        { status: 400 }
      );
    }

    // Save the file to realdata folder with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `uploaded_${timestamp}_${file.name}`;
    const filePath = path.join(process.cwd(), "data", "realdata", fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    try {
      // Run the import script
      await importCSVTransactions();

      return NextResponse.json({
        success: true,
        message: "CSV uploaded and processed successfully!",
        fileName: fileName,
      });
    } catch (error) {
      console.error("Import error:", error);
      return NextResponse.json(
        {
          error: "Failed to process CSV",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
