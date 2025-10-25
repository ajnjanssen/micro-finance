export function formatMonth(monthKey: string): string {
	const [year, month] = monthKey.split("-");
	const date = new Date(parseInt(year), parseInt(month) - 1);
	return date.toLocaleDateString("nl-NL", {
		year: "numeric",
		month: "long",
	});
}

export function getFrequencyLabel(frequency: string): string {
	const labels: Record<string, string> = {
		daily: "Dagelijks",
		weekly: "Wekelijks",
		monthly: "Maandelijks",
		irregular: "Onregelmatig",
	};
	return labels[frequency] || frequency;
}

export function getConfidenceColor(confidence: number): string {
	if (confidence >= 0.7) return "text-success";
	if (confidence >= 0.5) return "text-warning";
	return "text-error";
}
