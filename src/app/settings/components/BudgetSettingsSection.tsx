"use client";

import { useState, useEffect } from "react";

interface BudgetPercentages {
	needs: number;
	wants: number;
	savings: number;
}

export default function BudgetSettingsSection() {
	const [percentages, setPercentages] = useState<BudgetPercentages>({
		needs: 50,
		wants: 30,
		savings: 20,
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = async () => {
		try {
			const response = await fetch("/api/config");
			const config = await response.json();
			if (config.settings?.budgetPercentages) {
				setPercentages({
					needs: config.settings.budgetPercentages.needs * 100,
					wants: config.settings.budgetPercentages.wants * 100,
					savings: config.settings.budgetPercentages.savings * 100,
				});
			}
		} catch (error) {
			console.error("Error loading budget settings:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		// Validate percentages add up to 100
		const total = percentages.needs + percentages.wants + percentages.savings;
		if (Math.abs(total - 100) > 0.01) {
			alert(`Percentages moeten optellen tot 100%. Huidige totaal: ${total.toFixed(1)}%`);
			return;
		}

		setSaving(true);
		try {
			await fetch("/api/config/settings", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					budgetPercentages: {
						needs: percentages.needs / 100,
						wants: percentages.wants / 100,
						savings: percentages.savings / 100,
					},
				}),
			});
			alert("Budget percentages opgeslagen!");
		} catch (error) {
			console.error("Error saving budget settings:", error);
			alert("Fout bij opslaan");
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		setPercentages({ needs: 50, wants: 30, savings: 20 });
	};

	const total = percentages.needs + percentages.wants + percentages.savings;
	const isValid = Math.abs(total - 100) < 0.01;

	if (loading) {
		return <div className="animate-pulse">Loading...</div>;
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold">Budget Regel Instellingen</h2>
				<p className="text-sm text-base-content/60 mt-1">
					Pas de 50/30/20 regel aan naar jouw voorkeur
				</p>
			</div>

			<div className="card bg-base-200">
				<div className="card-body">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Needs */}
						<div>
							<label className="label">
								<span className="label-text font-semibold">🏠 Needs (Essentieel)</span>
							</label>
							<div className="form-control">
								<label className="input-group">
									<input
										type="number"
										min="0"
										max="100"
										step="1"
										value={percentages.needs}
										onChange={(e) =>
											setPercentages({ ...percentages, needs: Number(e.target.value) })
										}
										className="input input-bordered w-full"
									/>
									<span>%</span>
								</label>
							</div>
							<p className="text-xs text-base-content/60 mt-1">
								Vaste lasten: huur, verzekeringen, vervoer
							</p>
						</div>

						{/* Wants */}
						<div>
							<label className="label">
								<span className="label-text font-semibold">🎉 Wants (Levensstijl)</span>
							</label>
							<div className="form-control">
								<label className="input-group">
									<input
										type="number"
										min="0"
										max="100"
										step="1"
										value={percentages.wants}
										onChange={(e) =>
											setPercentages({ ...percentages, wants: Number(e.target.value) })
										}
										className="input input-bordered w-full"
									/>
									<span>%</span>
								</label>
							</div>
							<p className="text-xs text-base-content/60 mt-1">
								Boodschappen, restaurants, entertainment
							</p>
						</div>

						{/* Savings */}
						<div>
							<label className="label">
								<span className="label-text font-semibold">💰 Savings (Sparen)</span>
							</label>
							<div className="form-control">
								<label className="input-group">
									<input
										type="number"
										min="0"
										max="100"
										step="1"
										value={percentages.savings}
										onChange={(e) =>
											setPercentages({ ...percentages, savings: Number(e.target.value) })
										}
										className="input input-bordered w-full"
									/>
									<span>%</span>
								</label>
							</div>
							<p className="text-xs text-base-content/60 mt-1">
								Spaardoelen en toekomst
							</p>
						</div>
					</div>

					{/* Total Validation */}
					<div className={`alert mt-4 ${isValid ? "alert-success" : "alert-warning"}`}>
						<div className="flex items-center justify-between w-full">
							<span className="font-semibold">
								Totaal: {total.toFixed(1)}%
							</span>
							{!isValid && (
								<span className="text-sm">
									⚠️ Moet 100% zijn
								</span>
							)}
							{isValid && (
								<span className="text-sm">
									✅ Perfect!
								</span>
							)}
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-2 mt-4">
						<button
							className="btn btn-primary"
							onClick={handleSave}
							disabled={!isValid || saving}
						>
							{saving ? "Opslaan..." : "💾 Opslaan"}
						</button>
						<button className="btn btn-ghost" onClick={handleReset}>
							🔄 Reset naar 50/30/20
						</button>
					</div>
				</div>
			</div>

			{/* Visual Preview */}
			<div className="card bg-base-200">
				<div className="card-body">
					<h3 className="font-bold mb-4">Voorbeeld bij €2.800 inkomen</h3>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span>🏠 Needs</span>
							<span className="font-semibold">€ {((2800 * percentages.needs) / 100).toFixed(2)}</span>
						</div>
						<div className="flex items-center justify-between">
							<span>🎉 Wants</span>
							<span className="font-semibold">€ {((2800 * percentages.wants) / 100).toFixed(2)}</span>
						</div>
						<div className="flex items-center justify-between">
							<span>💰 Savings</span>
							<span className="font-semibold">€ {((2800 * percentages.savings) / 100).toFixed(2)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
