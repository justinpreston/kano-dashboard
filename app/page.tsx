"use client";

import { useEffect, useMemo, useState } from "react";
import { Cpu, HardDrive, Database, Clock, Activity, Layers } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ActivityRow } from "@/components/ui/ActivityRow";
import { CronRow } from "@/components/ui/CronRow";
import { ActivityLineChart } from "@/components/charts/ActivityLineChart";
import { ActivityPieChart } from "@/components/charts/ActivityPieChart";
import { SuccessRateGauge } from "@/components/charts/SuccessRateGauge";
import { HourlyHeatmap } from "@/components/charts/HourlyHeatmap";
import { Dock } from "@/components/shell/Dock";
import { TopBar } from "@/components/shell/TopBar";
import { StatusBar } from "@/components/shell/StatusBar";

// Matches actual API response shapes
interface SystemData {
  cpu: { percent: number; load: { "1m": number; "5m": number; "15m": number } };
  memory: { total: number; used: number; available: number; percent: number };
  disk: { total: number; used: number; free: number; percent: number };
  uptime: { seconds: number; formatted: string };
}

interface ActivityItem {
  type: string;
  jobId: string;
  jobName: string;
  status: string;
  timestamp: string;
  duration?: number;
  summary?: string;
}

interface ActivityResponse {
  activity: ActivityItem[];
  total: number;
}

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  lastStatus: string;
  lastRun: string | null;
  nextRun: string | null;
  consecutiveErrors: number;
  lastDuration?: number;
  schedule?: { kind: string; expr?: string; everyMs?: number };
}

interface CronResponse {
  jobs: CronJob[];
  stats: {
    total: number;
    enabled: number;
    disabled: number;
    errored: number;
    successRate: number;
    recentRunCount: number;
  };
  recentRuns: Array<{
    jobId: string;
    jobName: string;
    status: string;
    timestamp: string;
    duration?: number;
    summary?: string;
  }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

export default function DashboardPage() {
  const [system, setSystem] = useState<SystemData | null>(null);
  const [activityData, setActivityData] = useState<ActivityResponse>({ activity: [], total: 0 });
  const [cronData, setCronData] = useState<CronResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes, cronRes] = await Promise.all([
          fetch("/api/system"),
          fetch("/api/activity"),
          fetch("/api/crons"),
        ]);

        if (statsRes.ok) setSystem(await statsRes.json());
        if (activityRes.ok) setActivityData(await activityRes.json());
        if (cronRes.ok) setCronData(await cronRes.json());
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const activities = activityData.activity;

  const activityStats = useMemo(() => {
    const total = activities.length;
    const success = activities.filter((a) => a.status === "ok").length;
    const error = activities.filter((a) => a.status === "error").length;
    const successRate = total > 0 ? (success / total) * 100 : 0;

    const byType = activities.reduce<Record<string, number>>((acc, item) => {
      const key = item.jobName || item.type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return { total, success, error, successRate, byType };
  }, [activities]);

  const lineData = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach((a) => {
      const date = new Date(a.timestamp);
      const key = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }, [activities]);

  const pieData = useMemo(() => {
    // Group by job name, take top 8
    const sorted = Object.entries(activityStats.byType).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 8).map(([type, count]) => ({ type, count }));
  }, [activityStats.byType]);

  const heatmapData = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach((a) => {
      const date = new Date(a.timestamp);
      const key = `${date.getDay()}-${date.getHours()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([key, count]) => {
      const [day, hour] = key.split("-").map(Number);
      return { day, hour, count };
    });
  }, [activities]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔮</div>
          <div className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Loading Kano...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kano-shell" style={{ minHeight: "100vh" }}>
      <Dock />
      <TopBar />

      <main
        style={{
          marginLeft: "68px",
          marginTop: "48px",
          marginBottom: "32px",
          minHeight: "calc(100vh - 48px - 32px)",
          padding: "24px",
        }}
      >
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1
            className="text-2xl md:text-3xl font-bold mb-1"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
              letterSpacing: "-1.5px",
            }}
          >
            🔮 Kano Mission Control
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            System stats, recent activity, and cron overview
          </p>
        </div>

        {/* System Stats */}
        <div className="mb-6">
          <SectionHeader label="System" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <MetricCard
              icon={Cpu}
              value={`${system?.cpu.percent ?? 0}%`}
              label="CPU Usage"
              change={`Load: ${system?.cpu.load["1m"] ?? 0}`}
              changeColor="secondary"
            />
            <MetricCard
              icon={HardDrive}
              value={`${system?.memory.percent ?? 0}%`}
              label="Memory"
              change={`${formatBytes(system?.memory.used ?? 0)} / ${formatBytes(system?.memory.total ?? 0)}`}
              changeColor="secondary"
            />
            <MetricCard
              icon={Database}
              value={`${system?.disk.percent ?? 0}%`}
              label="Disk"
              change={`${formatBytes(system?.disk.used ?? 0)} / ${formatBytes(system?.disk.total ?? 0)}`}
              changeColor="secondary"
            />
            <MetricCard
              icon={Clock}
              value={system?.uptime.formatted ?? "—"}
              label="Uptime"
              change={`${Math.round((system?.uptime.seconds ?? 0) / 3600)}h total`}
              changeColor="secondary"
            />
          </div>
        </div>

        {/* Cron Stats */}
        {cronData && (
          <div className="mb-6">
            <SectionHeader label="Cron Health" />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                icon={Activity}
                value={`${cronData.stats.enabled}`}
                label="Active Jobs"
                change={`${cronData.stats.disabled} disabled`}
                changeColor="secondary"
              />
              <MetricCard
                icon={Activity}
                value={`${cronData.stats.successRate}%`}
                label="Success Rate"
                change={`${cronData.stats.recentRunCount} recent runs`}
                changeColor={cronData.stats.successRate >= 90 ? "positive" : "negative"}
              />
              <MetricCard
                icon={Activity}
                value={`${cronData.stats.errored}`}
                label="Errored Jobs"
                change={cronData.stats.errored > 0 ? "needs attention" : "all clear"}
                changeColor={cronData.stats.errored > 0 ? "negative" : "positive"}
              />
              <MetricCard
                icon={Layers}
                value={`${cronData.stats.total}`}
                label="Total Jobs"
                change={`${cronData.jobs.filter(j => j.consecutiveErrors > 0).length} with errors`}
                changeColor="secondary"
              />
            </div>
          </div>
        )}

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="lg:col-span-2 rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader label="Activity Trend" />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{activityData.total} total</span>
            </div>
            <ActivityLineChart data={lineData} />
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader label="Success Rate" />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{activityStats.success}/{activityStats.total}</span>
            </div>
            <SuccessRateGauge rate={activityStats.successRate} />
          </div>
        </div>

        {/* Activity mix + heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader label="Activity Mix" />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>by job</span>
            </div>
            <ActivityPieChart data={pieData} />
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader label="Hourly Heatmap" />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>last {activityData.total}</span>
            </div>
            <HourlyHeatmap data={heatmapData} />
          </div>
        </div>

        {/* Recent Activity + Cron Jobs */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Recent Activity */}
          <div className="xl:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="section-header">
              <div className="title flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
                Recent Activity
              </div>
            </div>
            <div className="p-4">
              {activities.length === 0 ? (
                <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                  No activity found
                </div>
              ) : (
                activities.slice(0, 10).map((activity, i) => (
                  <ActivityRow
                    key={`${activity.jobId}-${activity.timestamp}-${i}`}
                    time={new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    agent={activity.jobName}
                    description={activity.summary || `${activity.status} in ${activity.duration ? Math.round(activity.duration / 1000) + 's' : '—'}`}
                  />
                ))
              )}
            </div>
          </div>

          {/* Cron Jobs */}
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="section-header">
                <div className="title flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  Cron Jobs
                </div>
              </div>
              <div className="p-4 space-y-3">
                {!cronData || cronData.jobs.length === 0 ? (
                  <div className="text-center py-4" style={{ color: "var(--text-muted)" }}>
                    No cron jobs found
                  </div>
                ) : (
                  cronData.jobs
                    .filter(j => j.enabled)
                    .sort((a, b) => {
                      // Sort by next run time
                      if (!a.nextRun) return 1;
                      if (!b.nextRun) return -1;
                      return new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime();
                    })
                    .slice(0, 8)
                    .map((job) => (
                      <CronRow
                        key={job.id}
                        name={job.name}
                        nextRun={job.nextRun ? new Date(job.nextRun).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                        status={job.consecutiveErrors > 0 ? "ERROR" : job.lastStatus === "ok" ? "OK" : "WARN"}
                      />
                    ))
                )}
              </div>
            </div>

            {/* Errored Jobs */}
            {cronData && cronData.stats.errored > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border-error, var(--border))" }}>
                <div className="section-header" style={{ borderColor: "var(--error, #ef4444)" }}>
                  <div className="title flex items-center gap-2" style={{ color: "var(--error, #ef4444)" }}>
                    ⚠️ Errored Jobs ({cronData.stats.errored})
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {cronData.jobs
                    .filter(j => j.consecutiveErrors > 0)
                    .slice(0, 5)
                    .map((job) => (
                      <CronRow
                        key={job.id}
                        name={job.name}
                        nextRun={`${job.consecutiveErrors} consecutive errors`}
                        status="ERROR"
                      />
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </main>

      <StatusBar />
    </div>
  );
}
