"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: NavItem[];
  count?: number;
}

export default function Navigation() {
  const pathname = usePathname();
  const [counts, setCounts] = useState({
    accounts: 0,
    transactions: 0,
    categories: 0,
  });

  useEffect(() => {
    async function fetchCounts() {
      try {
        const response = await fetch("/api/finance");
        if (response.ok) {
          const data = await response.json();
          setCounts({
            accounts: data.accounts?.length || 0,
            transactions: data.transactions?.length || 0,
            categories: data.categories?.length || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      }
    }
    fetchCounts();
  }, []);

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/rekeningen", label: "Rekeningen", icon: "🏦" },
    { href: "/transactions", label: "Transacties", icon: "💰" },
    {
      href: "/budget",
      label: "Budget & Planning",
      icon: "💡",
      children: [
        { href: "/budget", label: "Budget Overzicht", icon: "💡" },
        { href: "/spaardoelen", label: "Spaardoelen", icon: "🎯" },
      ],
    },
    { href: "/vermogen", label: "Vermogen", icon: "💎" },
    {
      href: "/settings",
      label: "Instellingen",
      icon: "⚙️",
      children: [
        {
          href: "/settings?tab=accounts",
          label: "Rekeningen",
          icon: "🏦",
          count: counts.accounts,
        },
        {
          href: "/settings?tab=transactions",
          label: "Transacties",
          icon: "💰",
          count: counts.transactions,
        },
        {
          href: "/settings?tab=categories",
          label: "Categorieën",
          icon: "🏷️",
          count: counts.categories,
        },
        { href: "/settings?tab=logs", label: "Activity Log", icon: "📋" },
        {
          href: "/settings?tab=configuration",
          label: "Inkomsten & Uitgaven",
          icon: "💰",
        },
        {
          href: "/settings?tab=appearance",
          label: "Thema & Typografie",
          icon: "🌈",
        },
      ],
    },
  ];

  return (
    <aside className="w-64 h-screen bg-base-200 border-r border-base-300 flex flex-col sticky top-0">
      <div className="p-6 border-b border-base-300">
        <h1 className="text-xl font-bold text-base-content"> Micro Finance</h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.children &&
                item.children.some((child) => pathname === child.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors " +
                    (isActive && !item.children
                      ? "bg-primary text-primary-content"
                      : "text-base-content hover:bg-base-300")
                  }
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </Link>

                {item.children && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={
                              "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors " +
                              (isChildActive
                                ? "bg-primary text-primary-content"
                                : "text-base-content/70 hover:bg-base-300")
                            }
                          >
                            <span>{child.icon}</span>
                            {child.label}
                            {child.count !== undefined && child.count > 0 && (
                              <span className="ml-auto text-xs opacity-60">
                                ({child.count})
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-base-300 text-xs text-base-content/60">
        <p> 2025 Micro Finance</p>
      </div>
    </aside>
  );
}
