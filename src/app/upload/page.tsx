"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/ui/foundation/Header";
import Card from "@/ui/foundation/Card";
import Navigation from "@/components/Navigation";

export default function UploadPage() {
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleResetToOnboarding = async () => {
    if (
      !confirm(
        "⚠️ This will DELETE ALL your data (accounts, transactions, configuration) and restart the onboarding wizard. This cannot be undone! Are you sure?"
      )
    ) {
      return;
    }

    setClearing(true);
    setMessage("");

    try {
      // Clear all data
      await fetch("/api/clear-data", { method: "POST" });

      // Clear accounts by writing empty data
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reset-all",
        }),
      });

      // Reset onboarding flag
      localStorage.removeItem("onboarding_completed");

      setMessage("✅ Reset complete! Redirecting to onboarding...");

      // Redirect to home page after short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      setMessage("❌ Error resetting data. Please try again.");
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-base-200">
        <header className="shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-primary">
                  Micro Finance
                </h1>
                <p className="text-base-content">
                  Beheer je financiën eenvoudig
                </p>
              </div>
            </div>
          </div>
        </header>

        <Navigation
          activeTab="upload"
          onTabChange={(tabId) => {
            if (tabId === "upload") {
              // Already on upload page
              return;
            }
            if (tabId === "settings") {
              window.location.href = "/settings";
            } else {
              // Navigate to main page with the selected tab
              window.location.href = `/?tab=${tabId}`;
            }
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Header level={1}>Settings</Header>

        <Card>
          {clearing ? (
            <div className="space-y-6 text-center py-8">
              <div className="text-4xl animate-bounce">�</div>
              <div className="text-xl font-semibold text-base-content">
                Resetting your data...
              </div>
              <div className="text-sm text-base-content/70">
                This will only take a moment...
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="alert bg-warning/10 border-l-4 border-warning">
                <div>
                  <h3 className="font-bold text-lg mb-2">⚠️ Danger Zone</h3>
                  <p className="text-sm">
                    Use this option to completely reset your financial data and
                    start fresh with the onboarding wizard.
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetToOnboarding}
                disabled={clearing}
                className="btn btn-outline btn-error w-full"
              >
                🔄 Reset Everything & Restart Onboarding
              </button>

              {message && (
                <div
                  className={`alert ${
                    message.includes("Error") || message.includes("❌")
                      ? "alert-error"
                      : "alert-success"
                  }`}
                >
                  <span>{message}</span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
