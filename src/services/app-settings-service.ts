import { promises as fs } from "fs";
import path from "path";
import type { AppSettings } from "@/types/app-settings";
import { DEFAULT_APP_SETTINGS } from "@/types/app-settings";

const APP_SETTINGS_PATH = path.join(process.cwd(), "data", "app-settings.json");

/**
 * Get application settings
 */
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const data = await fs.readFile(APP_SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(data) as AppSettings;

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_APP_SETTINGS,
      ...settings,
      typography: {
        ...DEFAULT_APP_SETTINGS.typography,
        ...settings.typography,
      },
    };
  } catch (error) {
    console.error("Error reading app settings:", error);
    // Return default settings if file doesn't exist
    return DEFAULT_APP_SETTINGS;
  }
}

/**
 * Update application settings
 */
export async function updateAppSettings(
  settings: AppSettings
): Promise<AppSettings> {
  try {
    await fs.writeFile(APP_SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return settings;
  } catch (error) {
    console.error("Error writing app settings:", error);
    throw new Error("Failed to save app settings");
  }
}

/**
 * Initialize app settings file if it doesn't exist
 */
export async function initializeAppSettings(): Promise<void> {
  try {
    await fs.access(APP_SETTINGS_PATH);
  } catch {
    // File doesn't exist, create it with defaults
    await fs.writeFile(
      APP_SETTINGS_PATH,
      JSON.stringify(DEFAULT_APP_SETTINGS, null, 2)
    );
    console.log("Initialized app-settings.json with defaults");
  }
}
