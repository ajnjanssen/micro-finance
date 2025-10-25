import type { OnboardingData } from "./types";

export async function saveOnboardingData(data: OnboardingData): Promise<void> {
	const { accounts, incomeSources, expenses } = data;

	for (const account of accounts) {
		await fetch("/api/finance", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ type: "add-account", account }),
		});
	}

	for (const income of incomeSources) {
		await fetch("/api/config/income", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(income),
		});
	}

	for (const expense of expenses) {
		await fetch("/api/config/expenses", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(expense),
		});
	}
}
