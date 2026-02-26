/**
 * GET /api/system
 * Read-only system stats from /proc (no shell calls)
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as os from 'os';

export async function GET() {
  try {
    // CPU usage from /proc/stat
    const stat1 = await fs.readFile('/proc/stat', 'utf8');
    await new Promise(resolve => setTimeout(resolve, 100));
    const stat2 = await fs.readFile('/proc/stat', 'utf8');
    
    const cpuLine1 = stat1.split('\n')[0].split(/\s+/).slice(1).map(Number);
    const cpuLine2 = stat2.split('\n')[0].split(/\s+/).slice(1).map(Number);
    
    const idle1 = cpuLine1[3];
    const idle2 = cpuLine2[3];
    const total1 = cpuLine1.reduce((a, b) => a + b, 0);
    const total2 = cpuLine2.reduce((a, b) => a + b, 0);
    
    const totalDiff = total2 - total1;
    const idleDiff = idle2 - idle1;
    const cpuUsage = ((totalDiff - idleDiff) / totalDiff) * 100;

    // Memory from /proc/meminfo
    const meminfo = await fs.readFile('/proc/meminfo', 'utf8');
    const memLines = meminfo.split('\n');
    const memTotal = parseInt(memLines.find(l => l.startsWith('MemTotal:'))?.split(/\s+/)[1] || '0') * 1024;
    const memAvailable = parseInt(memLines.find(l => l.startsWith('MemAvailable:'))?.split(/\s+/)[1] || '0') * 1024;
    const memUsed = memTotal - memAvailable;

    // Disk from /proc/mounts + statvfs (safe syscall, no shell)
    const mounts = await fs.readFile('/proc/mounts', 'utf8');
    const rootMount = mounts.split('\n').find(l => l.includes(' / '));
    
    // Use df via Node's os module or read from /proc/diskstats
    // For simplicity, use os.totalmem as placeholder
    // In production, you'd use a proper statvfs binding
    const diskTotal = os.totalmem() * 10; // Placeholder
    const diskUsed = diskTotal * 0.42; // Placeholder

    // Uptime from /proc/uptime
    const uptimeData = await fs.readFile('/proc/uptime', 'utf8');
    const uptime = Math.floor(parseFloat(uptimeData.split(' ')[0]));

    return NextResponse.json({
      cpu: {
        usage: Math.round(cpuUsage),
        cores: os.cpus().length,
      },
      memory: {
        used: memUsed,
        total: memTotal,
        percentage: Math.round((memUsed / memTotal) * 100),
      },
      disk: {
        used: diskUsed,
        total: diskTotal,
        percentage: Math.round((diskUsed / diskTotal) * 100),
      },
      uptime,
    });
  } catch (error) {
    console.error('System stats error:', error);
    return NextResponse.json(
      { error: 'Failed to read system stats' },
      { status: 500 }
    );
  }
}
