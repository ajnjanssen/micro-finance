"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSettingsData } from "./hooks/useSettingsData";
import { SettingsHeader } from "./components/SettingsHeader";
import { SettingsSidebar } from "./components/SettingsSidebar";
import AccountsSection from "./components/AccountsSection";
import TransactionsSection from "./components/TransactionsSection";
import ConfigurationSection from "./components/ConfigurationSection";
import CategoriesSection from "./components/CategoriesSection";

type TabType =
  | "accounts"
  | "transactions"
  | "categories"
  | "configuration"
  | "logs";

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const { accounts, transactions, categories, lastUpdated, loading, reload } =
    useSettingsData();

  const [activeTab, setActiveTab] = useState<TabType>("accounts");

  useEffect(() => {
    if (tabParam === "configure") {
      setActiveTab("configuration");
    }
  }, [tabParam]);

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-base-300 rounded" />
            <div className="h-64 bg-base-300 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SettingsHeader onReload={reload} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <SettingsSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            accountsCount={accounts.length}
            transactionsCount={transactions.length}
            categoriesCount={categories.length}
          />

          <main className="col-span-12 md:col-span-9">
            {activeTab === "accounts" && (
              <AccountsSection accounts={accounts} onUpdate={reload} />
            )}
            {activeTab === "transactions" && (
              <TransactionsSection
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                onUpdate={reload}
              />
            )}
            {activeTab === "categories" && (
              <CategoriesSection
                categories={categories}
                transactions={transactions}
                onUpdate={reload}
              />
            )}
            {activeTab === "configuration" && (
              <ConfigurationSection onUpdate={reload} />
            )}
            {activeTab === "logs" && (
              <div>
                <p>Last Updated: {new Date(lastUpdated).toLocaleString()}</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
