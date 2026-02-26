"use client";

import { useEffect, useState } from "react";
import { DollarSign, Hash, BarChart3 } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface CostBreakdown {
  model: string;
  tokens: number;
  cost: number;
}

interface CostData {
  totalCost: number;
  totalTokens: number;
  breakdown: CostBreakdown[];
}

export default function CostsPage() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/costs")
      .then((res) => res.json())
      .then((data) => setCostData(data))
      .catch(() => setCostData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          💸 Costs & Usage
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Read-only token usage and cost breakdown</p>
      </div>

      <div className="mb-6">
        <SectionHeader label="Summary" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricCard icon={DollarSign} value={`$${(costData?.totalCost || 0).toFixed(2)}`} label="Total Cost" />
          <MetricCard icon={Hash} value={costData?.totalTokens || 0} label="Total Tokens" change="all-time" changeColor="secondary" />
          <MetricCard icon={BarChart3} value={costData?.breakdown?.length || 0} label="Models" change="active" changeColor="secondary" />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="section-header">
          <div className="title">Model Breakdown</div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading...</div>
          ) : !costData || costData.breakdown.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>No cost data found</div>
          ) : (
            <div className="space-y-3">
              {costData.breakdown.map((item) => (
                <div
                  key={item.model}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.model}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{item.tokens.toLocaleString()} tokens</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>${item.cost.toFixed(2)}</div>
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
