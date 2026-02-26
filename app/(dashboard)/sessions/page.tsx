"use client";

import { useEffect, useState } from "react";
import { Layers, Clock, Zap, Hash } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface Session {
  sessionKey: string;
  jobName: string;
  model: string;
  lastRun: string;
  runs: number;
  totalTokens: number;
  totalDuration: number;
  lastStatus: string;
  lastSummary: string;
}

interface SessionsData {
  available: boolean;
  sessions: Session[];
  total: number;
  note?: string;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SessionsPage() {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading sessions...</div>;
  }

  if (!data?.available || data.sessions.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>📡 Sessions</h1>
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          No session data available.
        </div>
      </div>
    );
  }

  const totalRuns = data.sessions.reduce((s, x) => s + x.runs, 0);
  const totalTokens = data.sessions.reduce((s, x) => s + x.totalTokens, 0);
  const models = new Set(data.sessions.map(s => s.model));

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          📡 Sessions
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Cron job sessions and their execution history
        </p>
        {data.note && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>ℹ️ {data.note}</p>
        )}
      </div>

      {/* Summary */}
      <div className="mb-6">
        <SectionHeader label="Overview" />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={Layers} value={data.total.toString()} label="Unique Sessions" change="from cron runs" changeColor="secondary" />
          <MetricCard icon={Zap} value={totalRuns.toString()} label="Total Executions" changeColor="secondary" />
          <MetricCard icon={Hash} value={formatTokens(totalTokens)} label="Total Tokens" changeColor="secondary" />
          <MetricCard icon={Clock} value={models.size.toString()} label="Models Used" changeColor="secondary" />
        </div>
      </div>

      {/* Sessions list */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="section-header">
          <div className="title flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: "var(--accent)" }} />
            All Sessions ({data.total})
          </div>
        </div>
        <div className="p-4 space-y-2">
          {data.sessions.map((s) => (
            <div
              key={s.sessionKey}
              className="p-3 rounded-lg"
              style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: s.lastStatus === "ok" ? "var(--success, #22c55e)" : "var(--error, #ef4444)" }}
                    />
                    <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {s.jobName}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--card)", color: "var(--text-muted)" }}>
                      {s.model}
                    </span>
                  </div>
                  {s.lastSummary && (
                    <p className="text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>
                      {s.lastSummary}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{timeAgo(s.lastRun)}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {s.runs} runs · {formatTokens(s.totalTokens)} tok
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
