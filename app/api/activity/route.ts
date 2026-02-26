import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const STATE_DIR = process.env.OPENCLAW_STATE || '/openclaw-state';
const CRON_DIR = join(STATE_DIR, 'cron');

interface CronRun {
  ts: number;
  jobId: string;
  action: string;
  status?: string;
  summary?: string;
  durationMs?: number;
}

interface CronJob {
  id: string;
  name?: string;
}

export async function GET() {
  try {
    // Load job names for enrichment
    let jobs: CronJob[] = [];
    try {
      const raw = await readFile(join(CRON_DIR, 'jobs.json'), 'utf-8');
      const parsed = JSON.parse(raw);
      jobs = parsed.jobs || parsed || [];
    } catch { /* no jobs */ }

    const jobNameMap = new Map(jobs.map(j => [j.id, j.name || j.id.slice(0, 8)]));

    // Read all run logs
    const runs: CronRun[] = [];
    try {
      const runFiles = await readdir(join(CRON_DIR, 'runs'));
      const recent = runFiles.sort().reverse().slice(0, 14); // 2 weeks
      for (const f of recent) {
        const content = await readFile(join(CRON_DIR, 'runs', f), 'utf-8');
        for (const line of content.split('\n').filter(Boolean)) {
          try { runs.push(JSON.parse(line)); } catch { /* skip */ }
        }
      }
    } catch { /* no runs */ }

    const sorted = runs
      .filter(r => r.action === 'finished')
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 100);

    return NextResponse.json({
      activity: sorted.map(r => ({
        type: 'cron_run',
        jobId: r.jobId,
        jobName: jobNameMap.get(r.jobId) || r.jobId.slice(0, 8),
        status: r.status || 'unknown',
        timestamp: new Date(r.ts).toISOString(),
        duration: r.durationMs,
        summary: r.summary?.slice(0, 300),
      })),
      total: sorted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
