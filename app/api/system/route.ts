import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';

export const dynamic = 'force-dynamic';

async function readProc(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return '';
  }
}

export async function GET() {
  try {
    const [meminfo, uptime, loadavg, stat] = await Promise.all([
      readProc('/proc/meminfo'),
      readProc('/proc/uptime'),
      readProc('/proc/loadavg'),
      readProc('/proc/stat'),
    ]);

    // Parse memory
    const memTotal = parseInt(meminfo.match(/MemTotal:\s+(\d+)/)?.[1] || '0') * 1024;
    const memAvailable = parseInt(meminfo.match(/MemAvailable:\s+(\d+)/)?.[1] || '0') * 1024;
    const memUsed = memTotal - memAvailable;

    // Parse uptime
    const uptimeSecs = parseFloat(uptime.split(' ')[0] || '0');

    // Parse load average
    const [load1, load5, load15] = (loadavg.split(' ').slice(0, 3)).map(Number);

    // Parse CPU usage from /proc/stat
    const cpuLine = stat.split('\n')[0];
    const cpuParts = cpuLine?.split(/\s+/).slice(1).map(Number) || [];
    const idle = cpuParts[3] || 0;
    const total = cpuParts.reduce((a, b) => a + b, 0);
    const cpuPercent = total > 0 ? ((total - idle) / total * 100) : 0;

    // Disk usage — read from /proc/mounts-adjacent info (best effort)
    let diskTotal = 0, diskUsed = 0, diskFree = 0;
    try {
      const { statfsSync } = await import('fs');
      const stats = (statfsSync as (path: string) => { blocks: number; bsize: number; bavail: number })('/');

      diskTotal = stats.blocks * stats.bsize;
      diskFree = stats.bavail * stats.bsize;
      diskUsed = diskTotal - diskFree;
    } catch {
      // statfsSync may not be available in container
    }

    return NextResponse.json({
      cpu: {
        percent: Math.round(cpuPercent * 10) / 10,
        load: { '1m': load1, '5m': load5, '15m': load15 },
      },
      memory: {
        total: memTotal,
        used: memUsed,
        available: memAvailable,
        percent: memTotal > 0 ? Math.round(memUsed / memTotal * 1000) / 10 : 0,
      },
      disk: {
        total: diskTotal,
        used: diskUsed,
        free: diskFree,
        percent: diskTotal > 0 ? Math.round(diskUsed / diskTotal * 1000) / 10 : 0,
      },
      uptime: {
        seconds: Math.round(uptimeSecs),
        formatted: formatUptime(uptimeSecs),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function formatUptime(secs: number): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
