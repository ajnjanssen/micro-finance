type TabType =
	| "accounts"
	| "transactions"
	| "categories"
	| "configuration"
	| "logs";

interface SettingsSidebarProps {
	activeTab: TabType;
	onTabChange: (tab: TabType) => void;
	accountsCount: number;
	transactionsCount: number;
	categoriesCount: number;
}

export function SettingsSidebar({
	activeTab,
	onTabChange,
	accountsCount,
	transactionsCount,
	categoriesCount,
}: SettingsSidebarProps) {
	return (
		<aside className="col-span-12 md:col-span-3">
			<nav className="card bg-base-100 shadow-sm fixed w-fit">
				<ul className="menu w-full">
					<li>
						<details open>
							<summary className="group">
								<span className="text-lg">📊</span>
								Gegevensbeheer
							</summary>
							<ul>
								<li>
									<a
										className={activeTab === "accounts" ? "active" : ""}
										onClick={() => onTabChange("accounts")}
									>
										🏦 Rekeningen ({accountsCount})
									</a>
								</li>
								<li>
									<a
										className={activeTab === "transactions" ? "active" : ""}
										onClick={() => onTabChange("transactions")}
									>
										💰 Transacties ({transactionsCount})
									</a>
								</li>
								<li>
									<a
										className={activeTab === "categories" ? "active" : ""}
										onClick={() => onTabChange("categories")}
									>
										🏷️ Categorieën ({categoriesCount})
									</a>
								</li>
								<li>
									<a
										className={activeTab === "logs" ? "active" : ""}
										onClick={() => onTabChange("logs")}
									>
										📋 Activity Log
									</a>
								</li>
							</ul>
						</details>
					</li>
					<li>
						<details>
							<summary className="group">
								<span className="text-lg">⚙️</span>
								Configuratie
							</summary>
							<ul>
								<li>
									<a
										className={activeTab === "configuration" ? "active" : ""}
										onClick={() => onTabChange("configuration")}
									>
										💰 Inkomsten & Uitgaven
									</a>
								</li>
							</ul>
						</details>
					</li>
				</ul>
			</nav>
		</aside>
	);
}
