import type { LogAction, LogEntity } from "@/types/activity-log";

/**
 * Client-side helper to log activities via API
 */
export async function logActivity(
  action: LogAction,
  entity: LogEntity,
  details: {
    entityId?: string;
    entityName?: string;
    description?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  try {
    // In a real implementation, you'd send this to an API endpoint
    // For now, we'll just console.log it as the backend will handle logging
    console.log(`[Activity Log] ${action} ${entity}`, details);
    
    // You can implement a POST endpoint to /api/activity-logs if you want
    // client-side logging as well
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
