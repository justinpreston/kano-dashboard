"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, Zap, Timer } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { CronRow } from "@/components/ui/CronRow";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: { kind: string; expr?: string; tz?: string; everyMs?: number };
  sessionTarget?: string;
  model?: string;
  lastRun: string | null;
  lastStatus: string;
  lastDuration?: number;
  nextRun: string | null;
  consecutiveErrors: number;
}

interface CronStats {
  total: number;
  enabled: number;
  disabled: number;
  errored: number;
  successRate: number;
  recentRunCount: number;
}

interface RecentRun {
  jobId: string;
  jobName: string;
  status: string;
  timestamp: string;
  duration?: number;
  summary?: string;
}

function formatSchedule(s: CronJob["schedule"]): string {
  if (!s) return "—";
  if (s.kind === "cron" && s.expr) return s.expr;
  if (s.kind === "every" && s.everyMs) {
    const mins = s.everyMs / 60000;
    if (mins >= 60) return `every ${(mins / 60).toFixed(0)}h`;
    return `every ${mins.toFixed(0)}m`;
  }
  return s.kind;
}

function timeAgo(ts: string | null): string {
  if (!ts) return "never";
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 0) {
    const mins = Math.abs(diff) / 60000;
    if (mins < 60) return `in ${Math.round(mins)}m`;
    return `in ${(mins / 60).toFixed(1)}h`;
  }
  const mins = diff / 60000;
  if (mins < 60) return `${Math.round(mins)}m ago`;
  const hrs = mins / 60;
  if (hrs < 24) return `${Math.round(hrs)}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [stats, setStats] = useState<CronStats | null>(null);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "enabled" | "errored">("enabled");

  useEffect(() => {
    fetch("/api/crons")
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs || []);
        setStats(data.stats || null);
        setRecentRuns(data.recentRuns || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter((j) => {
    if (filter === "enabled") return j.enabled;
    if (filter === "errored") return j.lastStatus === "error";
    return true;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          ⏱️ Cron Jobs
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Read-only schedule overview ({stats?.total ?? 0} jobs)</p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <SectionHeader label="Overview" />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={Zap} value={`${stats?.enabled ?? 0}`} label="Active Jobs" change={`${stats?.disabled ?? 0} disabled`} changeColor="secondary" />
          <MetricCard icon={CheckCircle} value={`${stats?.successRate ?? 0}%`} label="Success Rate" change={`${stats?.recentRunCount ?? 0} recent runs`} changeColor="positive" />
          <MetricCard icon={XCircle} value={`${stats?.errored ?? 0}`} label="Errored" changeColor={stats?.errored ? "negative" : "secondary"} />
          <MetricCard icon={Timer} value={recentRuns.length > 0 ? timeAgo(recentRuns[0].timestamp) : "—"} label="Last Run" changeColor="secondary" />
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="mb-6">
        <SectionHeader label="Weekly Calendar" />
        <div className="mt-4">
          <WeeklyCalendar />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-2">
        {(["enabled", "all", "errored"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: filter === f ? "var(--accent)" : "var(--card-elevated)",
              color: filter === f ? "#fff" : "var(--text-secondary)",
            }}
          >
            {f === "enabled" ? `Active (${jobs.filter((j) => j.enabled).length})` : f === "errored" ? `Errored (${jobs.filter((j) => j.lastStatus === "error").length})` : `All (${jobs.length})`}
          </button>
        ))}
      </div>

      {/* Job List */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="section-header">
          <div className="title flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Jobs ({filtered.length})
          </div>
        </div>
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>No jobs match filter</div>
          ) : (
            filtered.map((job) => (
              <div
                key={job.id}
                className="p-3 rounded-lg"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: !job.enabled
                          ? "var(--text-muted)"
                          : job.lastStatus === "ok"
                          ? "var(--success, #22c55e)"
                          : job.lastStatus === "error"
                          ? "var(--error, #ef4444)"
                          : "var(--warning, #f59e0b)",
                      }}
                    />
                    <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {job.name}
                    </span>
                    <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                      {formatSchedule(job.schedule)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {job.model && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "var(--card-elevated)", color: "var(--text-secondary)" }}>
                        {job.model.split("/").pop()}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {job.nextRun ? timeAgo(job.nextRun) : "—"}
                    </span>
                    {job.consecutiveErrors > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "var(--error, #ef4444)" }}>
                        {job.consecutiveErrors}×
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Runs */}
      {recentRuns.length > 0 && (
        <div className="mt-6 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="section-header">
            <div className="title flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: "var(--accent)" }} />
              Recent Runs ({recentRuns.length})
            </div>
          </div>
          <div className="p-4 space-y-2">
            {recentRuns.map((r, i) => (
              <div
                key={`${r.jobId}-${r.timestamp}-${i}`}
                className="p-2 rounded-lg flex items-center justify-between gap-3"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: r.status === "ok" ? "var(--success, #22c55e)" : "var(--error, #ef4444)" }}
                  />
                  <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.jobName}</span>
                  {r.duration && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {r.duration > 60000 ? `${(r.duration / 60000).toFixed(1)}m` : `${(r.duration / 1000).toFixed(0)}s`}
                    </span>
                  )}
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>{timeAgo(r.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
