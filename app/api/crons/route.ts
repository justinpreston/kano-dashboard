import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const STATE_DIR = process.env.OPENCLAW_STATE || '/openclaw-state';
const CRON_DIR = join(STATE_DIR, 'cron');

interface CronJob {
  id: string;
  name?: string;
  enabled?: boolean;
  schedule?: { kind: string; expr?: string; tz?: string; everyMs?: number };
  sessionTarget?: string;
  payload?: { kind: string; model?: string };
  state?: {
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    nextRunAtMs?: number;
    consecutiveErrors?: number;
    lastError?: string;
  };
  delivery?: { mode?: string; channel?: string };
}

interface CronRun {
  ts: number;
  jobId: string;
  action: string;
  status?: string;
  summary?: string;
  durationMs?: number;
}

export async function GET() {
  try {
    // Read jobs
    let jobs: CronJob[] = [];
    try {
      const raw = await readFile(join(CRON_DIR, 'jobs.json'), 'utf-8');
      const parsed = JSON.parse(raw);
      jobs = parsed.jobs || parsed || [];
    } catch { /* no jobs file */ }

    // Read recent run logs (last 7 days of JSONL files)
    const runs: CronRun[] = [];
    try {
      const runFiles = await readdir(join(CRON_DIR, 'runs'));
      // Sort descending, take last 7
      const recent = runFiles.sort().reverse().slice(0, 7);
      for (const f of recent) {
        const content = await readFile(join(CRON_DIR, 'runs', f), 'utf-8');
        for (const line of content.split('\n').filter(Boolean)) {
          try { runs.push(JSON.parse(line)); } catch { /* skip bad lines */ }
        }
      }
    } catch { /* no runs dir */ }

    // Stats
    const enabled = jobs.filter(j => j.enabled !== false);
    const errored = jobs.filter(j => j.state?.lastStatus === 'error');
    const recentRuns = runs.sort((a, b) => b.ts - a.ts).slice(0, 50);
    const successRate = recentRuns.length > 0
      ? Math.round(recentRuns.filter(r => r.status === 'ok').length / recentRuns.length * 100)
      : 0;

    return NextResponse.json({
      jobs: jobs.map(j => ({
        id: j.id,
        name: j.name || 'Unnamed',
        enabled: j.enabled !== false,
        schedule: j.schedule,
        sessionTarget: j.sessionTarget,
        model: j.payload?.model,
        lastRun: j.state?.lastRunAtMs ? new Date(j.state.lastRunAtMs).toISOString() : null,
        lastStatus: j.state?.lastStatus || 'unknown',
        lastDuration: j.state?.lastDurationMs,
        nextRun: j.state?.nextRunAtMs ? new Date(j.state.nextRunAtMs).toISOString() : null,
        consecutiveErrors: j.state?.consecutiveErrors || 0,
        lastError: j.state?.lastError,
        delivery: j.delivery,
      })),
      stats: {
        total: jobs.length,
        enabled: enabled.length,
        disabled: jobs.length - enabled.length,
        errored: errored.length,
        successRate,
        recentRunCount: recentRuns.length,
      },
      recentRuns: recentRuns.slice(0, 20).map(r => ({
        jobId: r.jobId,
        jobName: jobs.find(j => j.id === r.jobId)?.name || r.jobId.slice(0, 8),
        status: r.status,
        timestamp: new Date(r.ts).toISOString(),
        duration: r.durationMs,
        summary: r.summary?.slice(0, 200),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
