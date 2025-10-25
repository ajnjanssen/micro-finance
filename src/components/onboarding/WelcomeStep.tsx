export function WelcomeStep({ onNext }: { onNext: () => void }) {
	return (
		<div className="text-center space-y-6">
			<div className="text-6xl mb-4">💰</div>
			<h1 className="text-4xl font-bold text-primary">
				Welkom bij Micro Finance!
			</h1>
			<p className="text-lg text-base-content/70 max-w-2xl mx-auto">
				Laten we je financiële toekomst plannen. Deze wizard helpt je om je
				rekeningen, inkomsten en uitgaven in te stellen.
			</p>

			<div className="alert alert-info">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					className="stroke-current shrink-0 w-6 h-6"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div className="text-left">
					<h3 className="font-bold">Belangrijk: Configuratie eerst!</h3>
					<p className="text-sm">
						Deze app werkt met <strong>handmatig geconfigureerde</strong>{" "}
						bedragen, niet met berekeningen uit transacties. Jij vertelt ons wat
						je salaris, huur, etc. zijn.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
				<div className="card bg-base-200 p-4">
					<div className="text-3xl mb-2">🏦</div>
					<h3 className="font-semibold">Rekeningen</h3>
					<p className="text-sm text-base-content/70">
						Stel je huidige saldo's in
					</p>
				</div>
				<div className="card bg-base-200 p-4">
					<div className="text-3xl mb-2">💵</div>
					<h3 className="font-semibold">Inkomsten</h3>
					<p className="text-sm text-base-content/70">
						Configureer je salaris en andere inkomsten
					</p>
				</div>
				<div className="card bg-base-200 p-4">
					<div className="text-3xl mb-2">🏠</div>
					<h3 className="font-semibold">Uitgaven</h3>
					<p className="text-sm text-base-content/70">
						Voer je vaste lasten en abonnementen in
					</p>
				</div>
			</div>

			<button onClick={onNext} className="btn btn-primary btn-lg mt-8">
				Laten we beginnen! →
			</button>
		</div>
	);
}
