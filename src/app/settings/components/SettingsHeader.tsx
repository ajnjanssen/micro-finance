import { handleExport, handleImport } from "../utils/importExport";

interface SettingsHeaderProps {
	onReload: () => void;
}

export function SettingsHeader({ onReload }: SettingsHeaderProps) {
	return (
		<header className="bg-base-100 shadow-sm sticky top-0 z-10">
			<div className="max-w-7xl mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<a href="/" className="text-primary hover:text-primary-focus">
							← Terug naar Dashboard
						</a>
						<div className="border-l border-base-300 h-6" />
						<h1 className="text-2xl font-bold text-base-content">
							Instellingen
						</h1>
					</div>
					<div className="flex gap-2">
						<button onClick={handleExport} className="btn btn-outline btn-sm">
							📤 Export
						</button>
						<label className="btn btn-outline btn-sm">
							📥 Import
							<input
								type="file"
								accept=".json"
								onChange={(e) => handleImport(e, onReload)}
								className="hidden"
							/>
						</label>
					</div>
				</div>
			</div>
		</header>
	);
}
