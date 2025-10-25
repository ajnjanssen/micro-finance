import type { StepConfig, OnboardingStep } from "./types";

export const ONBOARDING_STEPS: StepConfig[] = [
	{ id: "welcome", title: "Welkom", number: 1 },
	{ id: "accounts", title: "Rekeningen", number: 2 },
	{ id: "income", title: "Inkomsten", number: 3 },
	{ id: "expenses", title: "Uitgaven", number: 4 },
	{ id: "complete", title: "Klaar", number: 5 },
];

export function getStepNumber(step: OnboardingStep): number {
	return ONBOARDING_STEPS.find((s) => s.id === step)?.number || 1;
}
