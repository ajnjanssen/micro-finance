import { promises as fs } from "fs";
import path from "path";
import type {
  ActivityLog,
  ActivityLogData,
  LogAction,
  LogEntity,
} from "@/types/activity-log";

const ACTIVITY_LOG_PATH = path.join(process.cwd(), "data", "activity-log.json");
const MAX_LOGS = 1000; // Keep last 1000 log entries

/**
 * Get all activity logs
 */
export async function getActivityLogs(): Promise<ActivityLog[]> {
  try {
    const data = await fs.readFile(ACTIVITY_LOG_PATH, "utf-8");
    const logData = JSON.parse(data) as ActivityLogData;
    return logData.logs || [];
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

/**
 * Add a new activity log entry
 */
export async function addActivityLog(
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
    const logs = await getActivityLogs();

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId: details.entityId,
      entityName: details.entityName,
      details: details.description,
      metadata: details.metadata,
    };

    // Add new log at the beginning
    logs.unshift(newLog);

    // Keep only the most recent logs
    const trimmedLogs = logs.slice(0, MAX_LOGS);

    const logData: ActivityLogData = {
      logs: trimmedLogs,
      version: "1.0.0",
    };

    await fs.writeFile(ACTIVITY_LOG_PATH, JSON.stringify(logData, null, 2));
  } catch (error) {
    console.error("Error adding activity log:", error);
  }
}

/**
 * Clear all activity logs
 */
export async function clearActivityLogs(): Promise<void> {
  const logData: ActivityLogData = {
    logs: [],
    version: "1.0.0",
  };

  await fs.writeFile(ACTIVITY_LOG_PATH, JSON.stringify(logData, null, 2));
}

/**
 * Initialize activity log file if it doesn't exist
 */
export async function initializeActivityLog(): Promise<void> {
  try {
    await fs.access(ACTIVITY_LOG_PATH);
  } catch {
    // File doesn't exist, create it
    await clearActivityLogs();
    console.log("Initialized activity-log.json");
  }
}
