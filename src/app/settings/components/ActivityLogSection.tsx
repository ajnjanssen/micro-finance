"use client";

import { useState, useEffect } from "react";
import type { ActivityLog } from "@/types/activity-log";

export default function ActivityLogSection() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/activity-logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to load activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (
      !confirm(
        "Weet je zeker dat je alle activiteiten logs wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/activity-logs", { method: "DELETE" });
      if (response.ok) {
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to clear activity logs:", error);
    }
  };

  const filteredLogs =
    filter === "all" ? logs : logs.filter((log) => log.entity === filter);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Terminal Header */}
      <div className="bg-neutral text-neutral-content rounded-t-lg px-4 py-2 flex justify-between items-center font-mono text-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-error"></div>
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <div className="w-3 h-3 rounded-full bg-success"></div>
          </div>
          <span className="ml-2">activity-monitor</span>
          <span className="text-neutral-content/50">—</span>
          <span className="text-neutral-content/70">{logs.length} records</span>
        </div>
        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            className="text-xs hover:text-error transition-colors"
            title="Clear log"
          >
            [clear]
          </button>
        )}
      </div>

      {/* Terminal Body */}
      <div className="bg-black text-green-400 rounded-b-lg p-4 font-mono text-xs overflow-x-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-green-400/50">
            <p>$ No activity logged</p>
            <p className="mt-2">Waiting for system events...</p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Table Header */}
            <div className="flex gap-4 pb-2 border-b border-green-400/30 text-green-300">
              <div className="w-20 shrink-0">TIME</div>
              <div className="w-24 shrink-0">ACTION</div>
              <div className="w-32 shrink-0">ENTITY</div>
              <div className="flex-1 min-w-0">NAME</div>
              <div className="w-40 shrink-0">METADATA</div>
            </div>

            {/* Table Rows */}
            <div className="max-h-96 overflow-y-auto">
              {filteredLogs.slice(0, 100).map((log, index) => (
                <div
                  key={log.id}
                  className="flex gap-4 py-1.5 hover:bg-green-400/5 transition-colors"
                >
                  {/* Timestamp */}
                  <div className="w-20 shrink-0 text-green-400/70">
                    {new Date(log.timestamp).toLocaleTimeString("nl-NL", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>

                  {/* Action */}
                  <div className="w-24 shrink-0">
                    <span
                      className={`${
                        log.action === "create"
                          ? "text-green-300"
                          : log.action === "update"
                            ? "text-cyan-400"
                            : log.action === "delete"
                              ? "text-red-400"
                              : "text-yellow-400"
                      }`}
                    >
                      {log.action.toUpperCase()}
                    </span>
                  </div>

                  {/* Entity */}
                  <div className="w-32 shrink-0 text-green-400/90">
                    {log.entity}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0 truncate text-green-200">
                    {log.entityName || log.entityId}
                  </div>

                  {/* Metadata */}
                  <div className="w-40 shrink-0 text-green-400/60 truncate">
                    {log.metadata && Object.keys(log.metadata).length > 0
                      ? Object.entries(log.metadata)
                          .slice(0, 2)
                          .map(([k, v]) => `${k}:${v}`)
                          .join(" ")
                      : "—"}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-2 mt-2 border-t border-green-400/30 text-green-400/50">
              <span className="mr-2">$</span>
              <span className="animate-pulse">█</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
