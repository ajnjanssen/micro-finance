"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SignOutButton from "./SignOutButton";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: NavItem[];
  count?: number;
}

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [counts, setCounts] = useState({
    accounts: 0,
    transactions: 0,
    categories: 0,
  });

  useEffect(() => {
    setMobileMenuOpen(false);
    if (
      pathname === "/login" ||
      pathname === "/storage-not-ready" ||
      pathname.startsWith("/auth/callback")
    ) {
      return;
    }

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
  }, [pathname]);

  if (
    pathname === "/login" ||
    pathname === "/storage-not-ready" ||
    pathname.startsWith("/auth/callback")
  ) {
    return null;
  }

  const renderNavigationItems = () => (
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
              onClick={() => setMobileMenuOpen(false)}
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
                        onClick={() => setMobileMenuOpen(false)}
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
  );

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/advies", label: "Advies", icon: "💡" },
    { href: "/rekeningen", label: "Rekeningen", icon: "🏦" },
    { href: "/transactions", label: "Transacties", icon: "💰" },
    {
      href: "/budget",
      label: "Budget & Planning",
      icon: "📈",
      children: [
        { href: "/budget", label: "Budget Overzicht", icon: "📊" },
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
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-base-300 bg-base-200 px-4 lg:hidden">
        <span className="font-bold text-base-content">Micro Finance</span>
        <button
          type="button"
          className="btn btn-ghost btn-square"
          aria-label={mobileMenuOpen ? "Menu sluiten" : "Menu openen"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" className="text-2xl">
            {mobileMenuOpen ? "×" : "☰"}
          </span>
        </button>
      </header>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-base-300 bg-base-200 lg:flex">
        <div className="border-b border-base-300 p-6">
          <h1 className="text-xl font-bold text-base-content">Micro Finance</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {renderNavigationItems()}
        </nav>
        <div className="border-t border-base-300">
          <SignOutButton />
          <div className="px-4 pb-4 text-xs text-base-content/60">
            <p>2025 Micro Finance</p>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/50"
            aria-label="Navigatiemenu sluiten"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            id="mobile-navigation"
            className="relative flex h-full w-[min(20rem,85vw)] flex-col border-r border-base-300 bg-base-200 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-base-300 p-4">
              <span className="font-bold">Micro Finance</span>
              <button
                type="button"
                className="btn btn-ghost btn-square btn-sm"
                aria-label="Menu sluiten"
                onClick={() => setMobileMenuOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              {renderNavigationItems()}
            </nav>
            <div className="border-t border-base-300">
              <SignOutButton />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
