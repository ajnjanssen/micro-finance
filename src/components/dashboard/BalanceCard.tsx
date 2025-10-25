import { useState } from "react";
import { formatCurrency } from "@/utils/formatters";

interface BalanceCardProps {
	currentBalance: number;
	onBalanceUpdate: () => void;
}

export function BalanceCard({
	currentBalance,
	onBalanceUpdate,
}: BalanceCardProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [edited, setEdited] = useState(currentBalance.toString());

	const handleSave = async () => {
		try {
			await fetch("/api/settings/update-balance", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ balance: parseFloat(edited) }),
			});
			setIsEditing(false);
			onBalanceUpdate();
		} catch (error) {
			console.error("Error updating balance:", error);
		}
	};

	return (
		<div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
			<div className="text-center">
				<h2 className="text-lg font-medium text-base-content/70 mb-2">
					Huidig Totaal Vermogen
				</h2>
				{isEditing ? (
					<div className="flex flex-col items-center gap-3">
						<input
							type="number"
							step="0.01"
							value={edited}
							onChange={(e) => setEdited(e.target.value)}
							className="input input-bordered input-lg text-center text-3xl font-bold w-64"
							autoFocus
						/>
						<div className="flex gap-2">
							<button onClick={handleSave} className="btn btn-primary btn-sm">
								Opslaan
							</button>
							<button
								onClick={() => setIsEditing(false)}
								className="btn btn-ghost btn-sm"
							>
								Annuleren
							</button>
						</div>
					</div>
				) : (
					<>
						<p className="text-5xl font-bold text-primary mb-1">
							{formatCurrency(currentBalance)}
						</p>
						<button
							onClick={() => setIsEditing(true)}
							className="btn btn-sm btn-ghost btn-circle"
						>
							✏️
						</button>
					</>
				)}
			</div>
		</div>
	);
}
