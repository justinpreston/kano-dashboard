"use client";

import { Server, Clock, Cpu, HardDrive, MemoryStick } from "lucide-react";

interface SystemInfoProps {
  data: {
    cpu: { usage: number; cores: number };
    memory: { used: number; total: number; percentage: number };
    disk: { used: number; total: number; percentage: number };
    uptime: number;
  } | null;
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h ${minutes}m`;
}

export function SystemInfo({ data }: SystemInfoProps) {
  if (!data) {
    return (
      <div 
        className="rounded-xl p-6 animate-pulse"
        style={{ backgroundColor: "var(--card)" }}
      >
        <div 
          className="h-6 rounded w-1/3 mb-4"
          style={{ backgroundColor: "var(--border)" }}
        ></div>
        <div className="space-y-3">
          <div className="h-4 rounded w-2/3" style={{ backgroundColor: "var(--border)" }}></div>
          <div className="h-4 rounded w-1/2" style={{ backgroundColor: "var(--border)" }}></div>
          <div className="h-4 rounded w-3/4" style={{ backgroundColor: "var(--border)" }}></div>
        </div>
      </div>
    );
  }

  const infoItems = [
    {
      icon: Cpu,
      label: "CPU Usage",
      value: `${data.cpu.usage}%`,
      sublabel: `${data.cpu.cores} cores`,
    },
    {
      icon: MemoryStick,
      label: "Memory",
      value: `${data.memory.percentage}%`,
      sublabel: `${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}`,
    },
    {
      icon: HardDrive,
      label: "Disk",
      value: `${data.disk.percentage}%`,
      sublabel: `${formatBytes(data.disk.used)} / ${formatBytes(data.disk.total)}`,
    },
    {
      icon: Clock,
      label: "Uptime",
      value: formatUptime(data.uptime),
      sublabel: "System uptime",
    },
  ];

  return (
    <div 
      className="rounded-xl p-6"
      style={{ backgroundColor: "var(--card)" }}
    >
      <h2 
        className="text-xl font-semibold mb-6 flex items-center gap-2"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
      >
        <Server className="w-5 h-5" style={{ color: "var(--accent)" }} />
        System Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {infoItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-lg"
              style={{ 
                backgroundColor: "rgba(26, 26, 26, 0.5)", 
                border: "1px solid rgba(42, 42, 42, 0.5)" 
              }}
            >
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                  {item.label}
                </div>
                <div className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {item.value}
                </div>
                <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {item.sublabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
