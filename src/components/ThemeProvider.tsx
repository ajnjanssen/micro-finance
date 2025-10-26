"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AppSettings, DaisyUITheme } from "@/types/app-settings";
import { DEFAULT_APP_SETTINGS } from "@/types/app-settings";

interface ThemeContextType {
  theme: DaisyUITheme;
  settings: AppSettings;
  setTheme: (theme: DaisyUITheme) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/app-settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          // Apply theme to HTML element
          document.documentElement.setAttribute("data-theme", data.theme);
        }
      } catch (error) {
        console.error("Failed to load app settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const setTheme = async (theme: DaisyUITheme) => {
    const newSettings = { ...settings, theme };
    await updateSettings(newSettings);
  };

  const updateSettings = async (newSettings: AppSettings) => {
    try {
      const response = await fetch("/api/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        // Apply theme to HTML element immediately
        document.documentElement.setAttribute("data-theme", data.theme);
      }
    } catch (error) {
      console.error("Failed to update app settings:", error);
      throw error;
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: settings.theme,
        settings,
        setTheme,
        updateSettings,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
