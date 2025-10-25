import type { Account } from "@/types/finance";
import type { NavigationProps } from "./types";
import { useAccountForm } from "./hooks/useAccountForm";
import { AccountForm } from "./AccountForm";
import { AccountList } from "./AccountList";

interface AccountsStepProps extends NavigationProps {
	accounts: Omit<Account, "id">[];
	onAdd: (account: Omit<Account, "id">) => void;
	onRemove: (index: number) => void;
}

export function AccountsStep({
	accounts,
	onAdd,
	onRemove,
	onNext,
	onBack,
}: AccountsStepProps) {
	const { showForm, formData, setShowForm, setFormData, handleSubmit } =
		useAccountForm(onAdd);

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-3xl font-bold mb-2">Voeg je rekeningen toe</h2>
				<p className="text-base-content/70">
					Stel je huidige saldo's in. Dit zijn je startpunten - geen
					berekeningen!
				</p>
			</div>

			<AccountList accounts={accounts} onRemove={onRemove} />

			{showForm ? (
				<AccountForm
					formData={formData}
					setFormData={setFormData}
					onSubmit={handleSubmit}
					onCancel={() => setShowForm(false)}
				/>
			) : (
				<button
					onClick={() => setShowForm(true)}
					className="btn btn-outline btn-block"
				>
					+ Rekening Toevoegen
				</button>
			)}

			<div className="flex justify-between pt-6">
				<button onClick={onBack} className="btn btn-ghost">
					← Terug
				</button>
				<button
					onClick={onNext}
					disabled={accounts.length === 0}
					className="btn btn-primary"
				>
					Volgende: Inkomsten →
				</button>
			</div>

			{accounts.length === 0 && (
				<div className="alert alert-warning">
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
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<span>Voeg minimaal één rekening toe om verder te gaan</span>
				</div>
			)}
		</div>
	);
}
