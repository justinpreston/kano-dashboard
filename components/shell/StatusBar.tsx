"use client";

import { useEffect, useState } from "react";
import { Cpu, HardDrive, MemoryStick, Clock } from "lucide-react";

interface SystemData {
  cpu: { percent: number; load: { "1m": number } };
  memory: { total: number; used: number; percent: number };
  disk: { total: number; used: number; percent: number };
  uptime: { seconds: number; formatted: string };
}

function formatGb(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024;
  return gb >= 1 ? `${gb.toFixed(1)}GB` : `${(bytes / 1024 / 1024).toFixed(0)}MB`;
}

export function StatusBar() {
  const [stats, setStats] = useState<SystemData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/system");
        if (res.ok) setStats(await res.json());
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const cpu = stats?.cpu.percent ?? 0;
  const ram = stats?.memory.percent ?? 0;
  const disk = stats?.disk.percent ?? 0;

  const cpuColor = cpu < 60 ? "var(--positive)" : cpu < 85 ? "var(--warning)" : "var(--negative)";
  const ramColor = ram < 60 ? "var(--positive)" : ram < 85 ? "var(--warning)" : "var(--negative)";
  const diskColor = disk < 60 ? "var(--positive)" : disk < 85 ? "var(--warning)" : "var(--negative)";

  const StatusMetric = ({ icon: Icon, label, value, barPercent, color }: any) => (
    <div className="flex items-center gap-1.5" style={{ height: "24px" }}>
      <Icon style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>{value}</span>
      {barPercent !== undefined && (
        <div style={{ width: "48px", height: "4px", backgroundColor: "var(--surface-elevated)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, barPercent)}%`, height: "100%", backgroundColor: color, borderRadius: "2px" }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="status-bar" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: "32px",
      backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)",
      display: "flex", alignItems: "center", padding: "0 16px 0 84px", gap: "16px", zIndex: 40,
    }}>
      <StatusMetric icon={Cpu} label="CPU" value={`${cpu}%`} barPercent={cpu} color={cpuColor} />
      <StatusMetric icon={MemoryStick} label="RAM" value={`${formatGb(stats?.memory.used ?? 0)}/${formatGb(stats?.memory.total ?? 0)}`} barPercent={ram} color={ramColor} />
      <StatusMetric icon={HardDrive} label="DISK" value={`${disk}%`} barPercent={disk} color={diskColor} />
      <div style={{ width: "1px", height: "16px", backgroundColor: "var(--border)" }} />
      <div className="flex items-center gap-1">
        <Clock style={{ width: "12px", height: "12px", color: "var(--text-muted)" }} />
        <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)" }}>
          Uptime: {stats?.uptime.formatted ?? "—"}
        </span>
      </div>
    </div>
  );
}
