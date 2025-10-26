export type LogAction =
  | "create"
  | "update"
  | "delete"
  | "import"
  | "export"
  | "categorize";

export type LogEntity =
  | "transaction"
  | "account"
  | "category"
  | "budget"
  | "savings-goal"
  | "config"
  | "app-settings";

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: LogAction;
  entity: LogEntity;
  entityId?: string;
  entityName?: string;
  details?: string;
  metadata?: Record<string, any>;
}

export interface ActivityLogData {
  logs: ActivityLog[];
  version: string;
}
