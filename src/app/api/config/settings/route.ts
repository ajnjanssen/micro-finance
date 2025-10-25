import { NextResponse } from "next/server";
import { FinancialConfigService } from "@/services/financial-config-service";

export async function PUT(request: Request) {
	try {
		const updates = await request.json();
		const service = FinancialConfigService.getInstance();
		
		const config = await service.loadConfig();
		config.settings = {
			...config.settings,
			...updates,
		};
		await service.saveConfig(config);
		
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error updating settings:", error);
		return NextResponse.json(
			{ error: "Failed to update settings" },
			{ status: 500 }
		);
	}
}
