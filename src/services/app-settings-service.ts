import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/types/app-settings";
import { DEFAULT_APP_SETTINGS } from "@/types/app-settings";

/**
 * Get application settings
 */
export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("theme,typography,version")
    .maybeSingle();
  if (error) throw new Error(`Failed to load app settings: ${error.message}`);
  if (!data) return DEFAULT_APP_SETTINGS;

  return {
    ...DEFAULT_APP_SETTINGS,
    ...data,
    typography: {
      ...DEFAULT_APP_SETTINGS.typography,
      ...(data.typography as Partial<AppSettings["typography"]>),
    },
  };
}

/**
 * Update application settings
 */
export async function updateAppSettings(
  settings: AppSettings,
): Promise<AppSettings> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Failed to verify user: ${authError.message}`);
  if (!authData.user) throw new Error("Authentication required.");

  const { error } = await supabase.from("app_settings").upsert({
    user_id: authData.user.id,
    theme: settings.theme,
    typography: settings.typography,
    version: settings.version,
  });
  if (error) throw new Error(`Failed to save app settings: ${error.message}`);
  return settings;
}

/**
 * Initialize app settings file if it doesn't exist
 */
export async function initializeAppSettings(): Promise<void> {
  await getAppSettings();
}
