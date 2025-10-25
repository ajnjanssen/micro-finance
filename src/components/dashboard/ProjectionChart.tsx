import { LineChart } from "@mui/x-charts/LineChart";
import type { BalanceProjection, Account } from "@/types/finance";
import { useEffect, useState } from "react";

interface ProjectionChartProps {
	projections: BalanceProjection[];
	accounts: Account[];
}

// Hardcoded fallback colors that look good
const FALLBACK_COLORS = {
	primary: "#570df8",   // DaisyUI default primary
	secondary: "#f000b8", // DaisyUI default secondary
	accent: "#37cdbe",    // DaisyUI default accent
	neutral: "#3d4451",   // DaisyUI default neutral
};

export function ProjectionChart({ projections, accounts }: ProjectionChartProps) {
	const [chartColors, setChartColors] = useState(FALLBACK_COLORS);

	// Try to get actual DaisyUI theme colors
	useEffect(() => {
		if (typeof window === 'undefined') return;
		
		// Create hidden elements to extract computed colors
		const extractColor = (className: string): string => {
			const temp = document.createElement('div');
			temp.className = className;
			temp.style.display = 'none';
			document.body.appendChild(temp);
			const color = window.getComputedStyle(temp).backgroundColor;
			document.body.removeChild(temp);
			return color;
		};

		try {
			const primary = extractColor('bg-primary');
			const secondary = extractColor('bg-secondary');
			const accent = extractColor('bg-accent');
			const neutral = extractColor('bg-neutral');

			console.log("Extracted DaisyUI colors:", { primary, secondary, accent, neutral });

			setChartColors({
				primary: primary || FALLBACK_COLORS.primary,
				secondary: secondary || FALLBACK_COLORS.secondary,
				accent: accent || FALLBACK_COLORS.accent,
				neutral: neutral || FALLBACK_COLORS.neutral,
			});
		} catch (error) {
			console.error("Failed to extract DaisyUI colors:", error);
		}
	}, []);

	if (projections.length === 0) return null;

	// Create series for total balance and each account
	const series = [
		{
			data: projections.map((p) => p.totalBalance),
			label: "Totaal",
			color: chartColors.primary,
			valueFormatter: (value: number | null) =>
				value !== null ? `€${value.toFixed(2)}` : "N/A",
		},
	];

	// Add a series for each account with DaisyUI colors
	const accountColorKeys: (keyof typeof chartColors)[] = ["secondary", "accent", "neutral"];

	accounts.forEach((account, index) => {
		const colorKey = accountColorKeys[index % accountColorKeys.length];
		series.push({
			data: projections.map((p) => p.accountBalances?.[account.id] || 0),
			label: account.name,
			color: chartColors[colorKey],
			valueFormatter: (value: number | null) =>
				value !== null ? `€${value.toFixed(2)}` : "N/A",
		});
	});

	const chartData = {
		xAxis: [
			{
				data: projections.map((p) => new Date(p.date)),
				scaleType: "time" as const,
				valueFormatter: (date: Date) =>
					date.toLocaleDateString("nl-NL", { month: "short", year: "numeric" }),
			},
		],
		series,
	};

	return (
		<div className="card bg-base-200 shadow">
			<h3 className="text-xl font-bold mb-4">Balans Projectie</h3>
			<div className="mb-4 flex gap-4 text-sm flex-wrap">
				{series.map((s, idx) => {
					// Use Tailwind color classes for legend
					const colorClass = idx === 0 ? "bg-primary" : 
					                   idx === 1 ? "bg-secondary" : 
					                   idx === 2 ? "bg-accent" : "bg-neutral";
					return (
						<div key={s.label} className="flex items-center gap-2">
							<div className={`w-3 h-3 rounded-full ${colorClass}`} />
							<span>{s.label}</span>
						</div>
					);
				})}
			</div>
			<LineChart
				xAxis={chartData.xAxis}
				series={chartData.series}
				width={800}
				height={400}
			/>
		</div>
	);
}
