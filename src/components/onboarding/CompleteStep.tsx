import { useState } from "react";

interface CompleteStepProps {
	accountsCount: number;
	incomeCount: number;
	expensesCount: number;
	onFinish: () => void;
	onBack: () => void;
}

export function CompleteStep({
	accountsCount,
	incomeCount,
	expensesCount,
	onFinish,
	onBack,
}: CompleteStepProps) {
	const [saving, setSaving] = useState(false);

	const handleFinish = async () => {
		setSaving(true);
		await onFinish();
	};

	return (
		<div className="text-center space-y-6">
			<div className="text-6xl mb-4">🎉</div>
			<h2 className="text-3xl font-bold">Je bent er bijna!</h2>
			<p className="text-lg text-base-content/70">
				Controleer je instellingen en klik op "Voltooien" om te beginnen.
			</p>

			<div className="stats stats-vertical lg:stats-horizontal shadow mx-auto">
				<div className="stat">
					<div className="stat-title">Rekeningen</div>
					<div className="stat-value text-primary">{accountsCount}</div>
					<div className="stat-desc">Geconfigureerd</div>
				</div>
				<div className="stat">
					<div className="stat-title">Inkomsten</div>
					<div className="stat-value text-success">{incomeCount}</div>
					<div className="stat-desc">Bronnen</div>
				</div>
				<div className="stat">
					<div className="stat-title">Uitgaven</div>
					<div className="stat-value text-error">{expensesCount}</div>
					<div className="stat-desc">Vaste lasten</div>
				</div>
			</div>

			<div className="alert alert-success">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="stroke-current shrink-0 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div className="text-left">
					<h3 className="font-bold">Wat kun je nu doen?</h3>
					<ul className="text-sm list-disc list-inside">
						<li>Bekijk je financiële projecties op het dashboard</li>
						<li>Importeer CSV bestanden als referentie (optioneel)</li>
						<li>Stel spaar doelen in</li>
						<li>Voeg meer inkomsten en uitgaven toe in Instellingen</li>
					</ul>
				</div>
			</div>

			<div className="flex justify-between pt-6">
				<button onClick={onBack} className="btn btn-ghost" disabled={saving}>
					← Terug
				</button>
				<button
					onClick={handleFinish}
					className="btn btn-primary btn-lg"
					disabled={saving}
				>
					{saving ? (
						<>
							<span className="loading loading-spinner" />
							Opslaan...
						</>
					) : (
						<>Voltooien en Beginnen! 🚀</>
					)}
				</button>
			</div>
		</div>
	);
}
