"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function Navigation({
  activeTab,
  onTabChange,
}: NavigationProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/rekeningen", label: "Rekeningen", icon: "🏦" },
    { href: "/transactions", label: "Transacties", icon: "💰" },
    { href: "/budget", label: "Budget", icon: "💡" },
    { href: "/spaardoelen", label: "Spaardoelen", icon: "🎯" },
    { href: "/categories", label: "Categorieën", icon: "📁" },
    { href: "/settings", label: "Instellingen", icon: "⚙️" },
  ];

  // If using old tab-based system, fall back to that
  if (activeTab && onTabChange) {
    const tabs = [
      { id: "dashboard", label: "Dashboard", icon: "📊" },
      { id: "accounts", label: "Rekeningen", icon: "🏦" },
      { id: "transactions", label: "Transacties", icon: "💰" },
      { id: "budget", label: "Budget", icon: "💡" },
      { id: "categories", label: "Categorieën", icon: "📁" },
      { id: "settings", label: "Instellingen", icon: "⚙️" },
    ];

    return (
      <nav className="border-b bg-base 200 border-base-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-primary text-primary-content"
                    : "border-transparent text-base-content hover:text-secondary hover:border-secondary-content cursor-pointer"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  // New routing-based navigation
  return (
    <nav className="border-b bg-base-200 border-base-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-base-content hover:text-primary hover:border-primary/50"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
