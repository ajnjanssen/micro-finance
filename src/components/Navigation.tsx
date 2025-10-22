"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface NavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Navigation({
  activeTab,
  onTabChange,
}: NavigationProps) {
  const tabs: Tab[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "accounts", label: "Rekeningen", icon: "🏦" },
    { id: "transactions", label: "Transacties", icon: "💰" },
    { id: "budget", label: "Budget", icon: "💡" },
    { id: "categories", label: "Categorieën", icon: "📁" },
    // { id: "savings", label: "Spaar Doelen", icon: "🎯" },
    // { id: "predictions", label: "Voorspellingen", icon: "🔮" },
    { id: "settings", label: "Instellingen", icon: "⚙️" },
  ];

  const handleTabClick = (tab: Tab) => {
    onTabChange(tab.id);
  };

  return (
    <nav className="border-b border-base-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
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
