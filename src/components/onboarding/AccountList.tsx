import type { Account } from "@/types/finance";
import { ACCOUNT_TYPES } from "./AccountForm";

interface AccountListProps {
	accounts: Omit<Account, "id">[];
	onRemove: (index: number) => void;
}

export function AccountList({ accounts, onRemove }: AccountListProps) {
	if (accounts.length === 0) return null;

	return (
		<div className="space-y-2">
			{accounts.map((account, index) => {
				const typeInfo = ACCOUNT_TYPES.find((t) => t.value === account.type);
				return (
					<div
						key={index}
						className="flex items-center justify-between p-4 bg-base-200 rounded-lg"
					>
						<div className="flex items-center gap-3">
							<span className="text-2xl">{typeInfo?.icon}</span>
							<div>
								<h4 className="font-semibold">{account.name}</h4>
								<p className="text-sm text-base-content/70">
									{typeInfo?.label}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<span className="text-lg font-bold">
								€{account.startingBalance.toFixed(2)}
							</span>
							<button
								onClick={() => onRemove(index)}
								className="btn btn-ghost btn-sm btn-circle text-error"
							>
								✕
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
}
