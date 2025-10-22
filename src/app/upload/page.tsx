"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/ui/foundation/Header";
import Card from "@/ui/foundation/Card";
import Navigation from "@/components/Navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const loadingMessages = [
    "Lemme see how responsible you've been 🤔",
    "Oh my! Okay no reason to panic 💀",
    "Maybe start saving up coupons 🤡",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setMessage("");
    } else {
      setFile(null);
      setMessage("Please select a valid CSV file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const startTime = Date.now();
    const minLoadingTime = 6000; // 5 seconds minimum loading time
    const stepDuration = minLoadingTime / 3; // ~1.67 seconds per step (5 seconds / 3 steps)

    setUploading(true);
    setCurrentStep(0);
    setMessage("");

    // Start cycling through messages - stop after 3 cycles
    let cycleCount = 0;
    const messageInterval = setInterval(() => {
      cycleCount++;
      if (cycleCount >= 3) {
        clearInterval(messageInterval);
        return;
      }
      setCurrentStep((prev) => (prev + 1) % loadingMessages.length);
    }, stepDuration);

    try {
      const formData = new FormData();
      formData.append("csv", file);

      const response = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      // Ensure minimum loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        clearInterval(messageInterval);
        if (response.ok) {
          setMessage("CSV uploaded and processed successfully!");
          // Wait 1 second then navigate to dashboard
          setTimeout(() => {
            router.push("/");
          }, 1000);
        } else {
          setMessage(`Error: ${result.error}`);
        }
        setUploading(false);
      }, remainingTime);
    } catch (error) {
      // Ensure minimum loading time even for errors
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        clearInterval(messageInterval);
        setMessage("An error occurred during upload.");
        setUploading(false);
      }, remainingTime);
    }
  };

  const handleClearData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all CSV-imported data? This will remove all transactions imported from CSV files but keep manually added transactions."
      )
    ) {
      return;
    }

    setClearing(true);
    setMessage("");

    try {
      const response = await fetch("/api/clear-data", {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Data cleared successfully! CSV transactions removed.");
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage("An error occurred while clearing data.");
    } finally {
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
        <Header level={1}>Upload CSV</Header>

        <Card>
          {uploading || clearing ? (
            <div className="space-y-6 text-center py-8">
              <div className="text-4xl animate-bounce">💸</div>
              <div className="text-xl font-semibold text-base-content">
                {uploading
                  ? loadingMessages[currentStep]
                  : "Clearing your financial data..."}
              </div>
              <div className="text-sm text-base-content/70">
                {uploading
                  ? "Processing your financial data..."
                  : "Removing CSV transactions..."}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Select CSV File</span>
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="file-input file-input-bordered w-full"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading || clearing}
                className="btn btn-primary w-full"
              >
                Upload and Process CSV
              </button>

              <div className="divider">OR</div>

              <button
                onClick={handleClearData}
                disabled={uploading || clearing}
                className="btn btn-error w-full"
              >
                {clearing ? "Clearing Data..." : "Clear CSV Data"}
              </button>

              {message && (
                <div
                  className={`alert ${
                    message.includes("Error") ? "alert-error" : "alert-success"
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
