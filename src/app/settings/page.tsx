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
import AppearanceSection from "./components/AppearanceSection";
import ActivityLogSection from "./components/ActivityLogSection";
import { PageLayout } from "@/components/PageLayout";

type TabType =
  | "accounts"
  | "transactions"
  | "categories"
  | "configuration"
  | "appearance"
  | "logs";

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const { accounts, transactions, categories, lastUpdated, loading, reload } =
    useSettingsData();

  const [activeTab, setActiveTab] = useState<TabType>("accounts");

  useEffect(() => {
    if (tabParam) {
      // Map "configure" to "configuration" for backwards compatibility
      const tab = tabParam === "configure" ? "configuration" : tabParam;
      // Only set if it's a valid tab type
      if (
        [
          "accounts",
          "transactions",
          "categories",
          "configuration",
          "appearance",
          "logs",
        ].includes(tab)
      ) {
        setActiveTab(tab as TabType);
      }
    }
  }, [tabParam]);

  if (loading) {
    return (
      <PageLayout>
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-base-300 rounded" />
          <div className="h-64 bg-base-300 rounded" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="xl">
      <SettingsHeader onReload={reload} />

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
          {activeTab === "appearance" && <AppearanceSection />}
          {activeTab === "logs" && <ActivityLogSection />}
        </main>
      </div>
    </PageLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
