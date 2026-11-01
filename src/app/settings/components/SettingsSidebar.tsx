type TabType =
  | "accounts"
  | "transactions"
  | "categories"
  | "configuration"
  | "appearance"
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
  const tabs: { id: TabType; label: string; icon: string; count?: number }[] = [
    { id: "accounts", label: "Rekeningen", icon: "🏦", count: accountsCount },
    {
      id: "transactions",
      label: "Transacties",
      icon: "💰",
      count: transactionsCount,
    },
    {
      id: "categories",
      label: "Categorieën",
      icon: "🏷️",
      count: categoriesCount,
    },
    { id: "logs", label: "Activiteiten", icon: "📋" },
    { id: "configuration", label: "Inkomsten & uitgaven", icon: "⚙️" },
    { id: "appearance", label: "Thema", icon: "🌈" },
  ];

  return (
    <aside className="col-span-12 min-w-0 md:col-span-3">
      <nav
        aria-label="Instellingen"
        className="card bg-base-100 shadow-sm md:sticky md:top-4"
      >
        <ul className="menu menu-horizontal w-full flex-nowrap gap-1 overflow-x-auto p-2 md:menu-vertical md:overflow-visible">
          {tabs.map((tab) => (
            <li key={tab.id} className="shrink-0 md:w-full">
              <button
                type="button"
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={
                  activeTab === tab.id
                    ? "active whitespace-nowrap"
                    : "whitespace-nowrap"
                }
                onClick={() => onTabChange(tab.id)}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className="text-xs opacity-60">{tab.count}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
