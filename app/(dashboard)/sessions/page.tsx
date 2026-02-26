"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Clock, Hash } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface SessionItem {
  id: string;
  label: string;
  created: string;
  lastActivity: string;
  messageCount: number;
  tokenUsage: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const totalMessages = sessions.reduce((sum, s) => sum + (s.messageCount || 0), 0);
    const totalTokens = sessions.reduce((sum, s) => sum + (s.tokenUsage || 0), 0);
    return { totalMessages, totalTokens };
  }, [sessions]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          💬 Sessions
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Recent OpenClaw sessions (read-only)</p>
      </div>

      <div className="mb-6">
        <SectionHeader label="Summary" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricCard icon={MessageSquare} value={sessions.length} label="Total Sessions" />
          <MetricCard icon={Hash} value={totals.totalTokens} label="Total Tokens" change="all-time" changeColor="secondary" />
          <MetricCard icon={Clock} value={totals.totalMessages} label="Messages" change="all-time" changeColor="secondary" />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="section-header">
          <div className="title">Session List</div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>No sessions found</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>{session.label}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{session.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{session.messageCount} messages</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(session.lastActivity).toLocaleString()}</div>
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
