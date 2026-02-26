"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MetricCard } from "@/components/ui/MetricCard";

interface ActivityItem {
  type: string;
  jobId: string;
  jobName: string;
  status: string;
  timestamp: string;
  duration?: number;
  summary?: string;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((res) => res.json())
      .then((data) => {
        setActivities(data.activity || []);
        setTotal(data.total || 0);
      })
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  const success = activities.filter(a => a.status === "ok").length;
  const errors = activities.filter(a => a.status === "error").length;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          📈 Activity Feed
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Latest cron job executions (read-only)</p>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <SectionHeader label="Summary" />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={Activity} value={total.toString()} label="Total Runs" change="last 100 shown" changeColor="secondary" />
          <MetricCard icon={CheckCircle} value={success.toString()} label="Succeeded" changeColor="positive" />
          <MetricCard icon={XCircle} value={errors.toString()} label="Failed" changeColor={errors > 0 ? "negative" : "secondary"} />
          <MetricCard icon={Clock} value={activities.length > 0 ? timeAgo(activities[0].timestamp) : "—"} label="Last Run" changeColor="secondary" />
        </div>
      </div>

      {/* Activity List */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="section-header">
          <div className="title flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Recent Activity ({activities.length})
          </div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>No activity found</div>
          ) : (
            <div className="space-y-2">
              {activities.map((a, i) => (
                <div
                  key={`${a.jobId}-${a.timestamp}-${i}`}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: a.status === "ok" ? "var(--success, #22c55e)" : "var(--error, #ef4444)" }}
                        />
                        <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {a.jobName}
                        </span>
                        {a.duration && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {a.duration > 60000 ? `${(a.duration / 60000).toFixed(1)}m` : `${(a.duration / 1000).toFixed(0)}s`}
                          </span>
                        )}
                      </div>
                      {a.summary && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                          {a.summary}
                        </p>
                      )}
                    </div>
                    <div className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                      {timeAgo(a.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
