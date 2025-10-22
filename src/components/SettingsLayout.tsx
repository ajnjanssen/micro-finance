"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

interface SettingsNavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  const navItems: SettingsNavItem[] = [
    {
      id: "configure",
      label: "Inkomsten & Uitgaven",
      icon: "💰",
      href: "/settings/configure",
    },
    { id: "data", label: "Gegevensbeheer", icon: "📊", href: "/settings" },
    {
      id: "general",
      label: "Algemene Instellingen",
      icon: "⚙️",
      href: "/settings/general",
    },
  ];

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-base-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary hover:text-primary-focus">
              ← Terug naar Dashboard
            </Link>
            <div className="border-l border-base-300 h-6"></div>
            <h1 className="text-2xl font-bold text-base-content">
              Instellingen
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Vertical Navigation */}
          <aside className="col-span-12 md:col-span-3">
            <nav className="card bg-base-100 shadow-sm">
              <ul className="menu">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`${
                        pathname === item.href
                          ? "active bg-primary text-primary-content"
                          : ""
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content Area */}
          <main className="col-span-12 md:col-span-9">{children}</main>
        </div>
      </div>
    </div>
  );
}
