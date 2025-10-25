import { ONBOARDING_STEPS, getStepNumber } from "./constants";
import type { OnboardingStep } from "./types";

interface ProgressBarProps {
	currentStep: OnboardingStep;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
	const currentNumber = getStepNumber(currentStep);

	return (
		<div className="p-6 border-b bg-base-200 border-base-300">
			<ul className="steps steps-horizontal w-full">
				{ONBOARDING_STEPS.map((step) => (
					<li
						key={step.id}
						className={`step ${currentNumber >= step.number ? "step-primary" : ""}`}
						data-content={currentNumber > step.number ? "✓" : step.number}
					>
						{step.title}
					</li>
				))}
			</ul>
		</div>
	);
}
