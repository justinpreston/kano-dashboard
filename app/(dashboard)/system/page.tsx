"use client";

import { useEffect, useState } from "react";
import { Cpu, HardDrive, Database, Clock } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SystemInfo } from "@/components/SystemInfo";

interface SystemStats {
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; percentage: number };
  disk: { used: number; total: number; percentage: number };
  uptime: number;
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}

export default function SystemPage() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/system")
      .then((res) => res.json())
      .then((data) => setSystemStats(data))
      .catch(() => setSystemStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          🖥️ System Monitor
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Read-only system metrics</p>
      </div>

      <div className="mb-6">
        <SectionHeader label="System Stats" />
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

      <div className="mb-6">
        <SectionHeader label="Details" />
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading...</div>
          ) : (
            <SystemInfo data={systemStats} />
          )}
        </div>
      </div>
    </div>
  );
}
