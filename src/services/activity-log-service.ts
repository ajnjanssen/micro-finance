import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityLog, LogAction, LogEntity } from "@/types/activity-log";

const MAX_LOGS = 1000;

function throwOnError(error: { message: string } | null): void {
  if (error) {
    throw new Error(`Supabase activity-log operation failed: ${error.message}`);
  }
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id,logged_at,action,entity,entity_id,entity_name,details,metadata")
    .order("logged_at", { ascending: false })
    .limit(MAX_LOGS);
  throwOnError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    timestamp: row.logged_at,
    action: row.action as LogAction,
    entity: row.entity as LogEntity,
    ...(row.entity_id ? { entityId: row.entity_id } : {}),
    ...(row.entity_name ? { entityName: row.entity_name } : {}),
    ...(row.details ? { details: row.details } : {}),
    ...(row.metadata
      ? { metadata: row.metadata as Record<string, unknown> }
      : {}),
  }));
}

export async function addActivityLog(
  action: LogAction,
  entity: LogEntity,
  details: {
    entityId?: string;
    entityName?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  throwOnError(authError);
  if (!authData.user) throw new Error("Authentication required.");

  const { error } = await supabase.from("activity_logs").insert({
    user_id: authData.user.id,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    logged_at: new Date().toISOString(),
    action,
    entity,
    entity_id: details.entityId ?? null,
    entity_name: details.entityName ?? null,
    details: details.description ?? null,
    metadata: details.metadata ?? null,
  });
  throwOnError(error);
}

export async function upsertActivityLogs(logs: ActivityLog[]): Promise<void> {
  if (logs.length === 0) return;

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  throwOnError(authError);
  if (!authData.user) throw new Error("Authentication required.");

  const { error } = await supabase.from("activity_logs").upsert(
    logs.map((log) => ({
      user_id: authData.user.id,
      id: log.id,
      logged_at: log.timestamp,
      action: log.action,
      entity: log.entity,
      entity_id: log.entityId ?? null,
      entity_name: log.entityName ?? null,
      details: log.details ?? null,
      metadata: log.metadata ?? null,
    })),
    { onConflict: "user_id,id" },
  );
  throwOnError(error);
}

export async function clearActivityLogs(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("activity_logs")
    .delete()
    .not("id", "is", null);
  throwOnError(error);
}

export async function initializeActivityLog(): Promise<void> {
  // Logs are created on demand; no shared local file needs initialization.
}
