"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Onboarding from "@/components/onboarding";

export default function Home() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const response = await fetch("/api/finance");
      const data = await response.json();

      if (data.accounts.length === 0) {
        setShowOnboarding(true);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content">Laden...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return null;
}
