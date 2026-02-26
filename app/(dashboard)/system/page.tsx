"use client";

import { useEffect, useState } from "react";
import { Cpu, HardDrive, Database, Clock, Activity, Server } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface SystemData {
  cpu: { percent: number; load: { "1m": number; "5m": number; "15m": number } };
  memory: { total: number; used: number; available: number; percent: number };
  disk: { total: number; used: number; free: number; percent: number };
  uptime: { seconds: number; formatted: string };
}

function formatBytes(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

export default function SystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/system");
        if (res.ok) setData(await res.json());
      } catch {}
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          🖥️ System Monitor
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Read-only system metrics (auto-refresh 10s)</p>
      </div>

      <div className="mb-6">
        <SectionHeader label="System Stats" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <MetricCard icon={Cpu} value={`${data?.cpu.percent ?? 0}%`} label="CPU Usage" change={`Load: ${data?.cpu.load["1m"] ?? 0}`} changeColor="secondary" />
          <MetricCard icon={HardDrive} value={`${data?.memory.percent ?? 0}%`} label="Memory" change={`${formatBytes(data?.memory.used ?? 0)} / ${formatBytes(data?.memory.total ?? 0)}`} changeColor="secondary" />
          <MetricCard icon={Database} value={`${data?.disk.percent ?? 0}%`} label="Disk" change={`${formatBytes(data?.disk.used ?? 0)} / ${formatBytes(data?.disk.total ?? 0)}`} changeColor="secondary" />
          <MetricCard icon={Clock} value={data?.uptime.formatted ?? "—"} label="Uptime" change={`${Math.round((data?.uptime.seconds ?? 0) / 3600)}h total`} changeColor="secondary" />
        </div>
      </div>

      <div className="mb-6">
        <SectionHeader label="Details" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CPU Detail */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>CPU</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>Usage</span>
                <span style={{ color: "var(--text-primary)" }}>{data?.cpu.percent ?? 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: "var(--card-elevated)" }}>
                <div className="h-2 rounded-full" style={{ width: `${data?.cpu.percent ?? 0}%`, backgroundColor: "var(--accent)", transition: "width 0.5s" }} />
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>Load (1m / 5m / 15m)</span>
                <span style={{ color: "var(--text-primary)" }}>{data?.cpu.load["1m"] ?? 0} / {data?.cpu.load["5m"] ?? 0} / {data?.cpu.load["15m"] ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Memory Detail */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>Memory</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>Used / Total</span>
                <span style={{ color: "var(--text-primary)" }}>{formatBytes(data?.memory.used ?? 0)} / {formatBytes(data?.memory.total ?? 0)}</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: "var(--card-elevated)" }}>
                <div className="h-2 rounded-full" style={{ width: `${data?.memory.percent ?? 0}%`, backgroundColor: "var(--accent)", transition: "width 0.5s" }} />
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>Available</span>
                <span style={{ color: "var(--text-primary)" }}>{formatBytes(data?.memory.available ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* Disk Detail */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>Disk</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>Used / Total</span>
                <span style={{ color: "var(--text-primary)" }}>{formatBytes(data?.disk.used ?? 0)} / {formatBytes(data?.disk.total ?? 0)}</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: "var(--card-elevated)" }}>
                <div className="h-2 rounded-full" style={{ width: `${data?.disk.percent ?? 0}%`, backgroundColor: "var(--accent)", transition: "width 0.5s" }} />
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>Free</span>
                <span style={{ color: "var(--text-primary)" }}>{formatBytes(data?.disk.free ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* Uptime Detail */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>Uptime</span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{data?.uptime.formatted ?? "—"}</div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>{Math.round((data?.uptime.seconds ?? 0) / 86400)} days total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
