"use client";

import { useEffect, useState } from "react";
import { DollarSign, Hash, BarChart3, Zap, Calendar, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ActivityLineChart } from "@/components/charts/ActivityLineChart";

interface ModelBreakdown {
  model: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  runs: number;
  cost: number;
}

interface DailyPoint {
  date: string;
  cost: number;
  runs: number;
  tokens: number;
}

interface CostData {
  available: boolean;
  totalCost: number;
  totalTokens: number;
  totalInput: number;
  totalOutput: number;
  totalRuns: number;
  today: { cost: number; runs: number; tokens: number };
  last7Days: { cost: number; runs: number };
  breakdown: ModelBreakdown[];
  daily: DailyPoint[];
  note?: string;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export default function CostsPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/costs")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading costs...</div>
    );
  }

  if (!data?.available) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>💸 Costs & Usage</h1>
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          No usage data available yet.
        </div>
      </div>
    );
  }

  const dailyChart = data.daily.slice(-14).map(d => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: d.runs,
  }));

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          💸 Costs & Usage
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Estimated token costs from cron job runs
        </p>
        {data.note && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>ℹ️ {data.note}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <SectionHeader label="Overview" />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard icon={DollarSign} value={`$${data.totalCost.toFixed(2)}`} label="Total Cost" change="all-time" changeColor="secondary" />
          <MetricCard icon={Hash} value={formatTokens(data.totalTokens)} label="Total Tokens" change={`${formatTokens(data.totalInput)} in / ${formatTokens(data.totalOutput)} out`} changeColor="secondary" />
          <MetricCard icon={Zap} value={data.totalRuns.toString()} label="Total Runs" change="with usage data" changeColor="secondary" />
          <MetricCard icon={Calendar} value={`$${data.today.cost.toFixed(2)}`} label="Today" change={`${data.today.runs} runs`} changeColor="secondary" />
          <MetricCard icon={TrendingUp} value={`$${data.last7Days.cost.toFixed(2)}`} label="Last 7 Days" change={`${data.last7Days.runs} runs`} changeColor="secondary" />
          <MetricCard icon={BarChart3} value={data.breakdown.length.toString()} label="Models Used" change="distinct" changeColor="secondary" />
        </div>
      </div>

      {/* Daily trend + Model breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Daily runs chart */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader label="Daily Runs (14d)" />
          </div>
          <ActivityLineChart data={dailyChart} />
        </div>

        {/* Model cost breakdown */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader label="Cost by Model" />
          </div>
          <div className="space-y-3">
            {data.breakdown.map((item) => {
              const pct = data.totalCost > 0 ? (item.cost / data.totalCost) * 100 : 0;
              return (
                <div key={item.model}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.model}</span>
                    <span className="text-sm font-mono" style={{ color: "var(--accent)" }}>${item.cost.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ backgroundColor: "var(--card-elevated)" }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: "var(--accent)", transition: "width 0.5s" }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.runs} runs</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatTokens(item.tokens)} tokens</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full breakdown table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="section-header">
          <div className="title">Detailed Breakdown</div>
        </div>
        <div className="p-4 space-y-2">
          {data.breakdown.map((item) => (
            <div
              key={item.model}
              className="p-3 rounded-lg flex items-center justify-between"
              style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}
            >
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.model}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatTokens(item.inputTokens)} input · {formatTokens(item.outputTokens)} output · {item.runs} runs
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono font-medium" style={{ color: "var(--text-primary)" }}>${item.cost.toFixed(2)}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  ${(item.cost / item.runs).toFixed(3)}/run
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
