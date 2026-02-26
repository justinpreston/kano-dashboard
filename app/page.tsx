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

interface ActivityItem {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: string;
}

interface SessionItem {
  id: string;
  label: string;
  created: string;
  lastActivity: string;
  messageCount: number;
  tokenUsage: number;
}

interface CronItem {
  id: string;
  label: string;
  schedule: string;
  nextRun: string;
  status: string;
}

interface SystemStats {
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; percentage: number };
  disk: { used: number; total: number; percentage: number };
  uptime: number;
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}

export default function DashboardPage() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [crons, setCrons] = useState<CronItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes, sessionsRes, cronRes] = await Promise.all([
          fetch("/api/system"),
          fetch("/api/activity"),
          fetch("/api/sessions"),
          fetch("/api/crons"),
        ]);

        if (statsRes.ok) setSystemStats(await statsRes.json());
        if (activityRes.ok) setActivities(await activityRes.json());
        if (sessionsRes.ok) setSessions(await sessionsRes.json());
        if (cronRes.ok) setCrons(await cronRes.json());
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const activityStats = useMemo(() => {
    const total = activities.length;
    const success = activities.filter((a) => a.status === "success").length;
    const error = activities.filter((a) => a.status === "error").length;
    const successRate = total > 0 ? (success / total) * 100 : 0;

    const byType = activities.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
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
    return Object.entries(activityStats.byType).map(([type, count]) => ({ type, count }));
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
          System stats, recent activity, sessions, and cron overview
        </p>
      </div>

      {/* System Stats */}
      <div className="mb-6">
        <SectionHeader label="System" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <MetricCard
            icon={Cpu}
            value={`${systemStats?.cpu.usage || 0}%`}
            label="CPU Usage"
            change={`${systemStats?.cpu.cores || 0} cores`}
            changeColor="secondary"
          />
          <MetricCard
            icon={HardDrive}
            value={`${systemStats?.memory.percentage || 0}%`}
            label="Memory"
            change={`${formatBytes(systemStats?.memory.used || 0)} used`}
            changeColor="secondary"
          />
          <MetricCard
            icon={Database}
            value={`${systemStats?.disk.percentage || 0}%`}
            label="Disk"
            change={`${formatBytes(systemStats?.disk.used || 0)} used`}
            changeColor="secondary"
          />
          <MetricCard
            icon={Clock}
            value={`${Math.floor((systemStats?.uptime || 0) / 3600)}h`}
            label="Uptime"
            change={`${Math.floor(((systemStats?.uptime || 0) % 3600) / 60)}m`}
            changeColor="secondary"
          />
        </div>
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="lg:col-span-2 rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader label="Activity Trend" />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{activities.length} total</span>
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
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>by type</span>
          </div>
          <ActivityPieChart data={pieData} />
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader label="Hourly Heatmap" />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>last 100</span>
          </div>
          <HourlyHeatmap data={heatmapData} />
        </div>
      </div>

      {/* Activity + Sessions + Cron */}
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
              activities.slice(0, 8).map((activity) => (
                <ActivityRow
                  key={activity.id}
                  time={new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  agent={activity.type}
                  description={activity.description}
                />
              ))
            )}
          </div>
        </div>

        {/* Sessions + Cron */}
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="section-header">
              <div className="title flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: "var(--accent)" }} />
                Session Summary
              </div>
            </div>
            <div className="p-4 space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-4" style={{ color: "var(--text-muted)" }}>
                  No sessions found
                </div>
              ) : (
                sessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}
                  >
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{session.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {session.messageCount} messages · {new Date(session.lastActivity).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="section-header">
              <div className="title flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
                Cron Overview
              </div>
            </div>
            <div className="p-4 space-y-3">
              {crons.length === 0 ? (
                <div className="text-center py-4" style={{ color: "var(--text-muted)" }}>
                  No cron jobs found
                </div>
              ) : (
                crons.slice(0, 5).map((job) => (
                  <CronRow
                    key={job.id}
                    name={job.label || "Cron job"}
                    nextRun={new Date(job.nextRun).toLocaleString()}
                    status={job.status === "active" ? "OK" : "WARN"}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
      </main>

      <StatusBar />
    </div>
  );
}
