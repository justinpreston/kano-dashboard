import { NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const runsDir = join(process.env.OPENCLAW_STATE || '/openclaw-state', 'cron', 'runs');

  try {
    const files = readdirSync(runsDir).filter(f => f.endsWith('.jsonl'));

    const sessions: Record<string, {
      sessionKey: string;
      jobName: string;
      model: string;
      lastRun: string;
      runs: number;
      totalTokens: number;
      totalDuration: number;
      lastStatus: string;
      lastSummary: string;
    }> = {};

    for (const file of files) {
      try {
        const content = readFileSync(join(runsDir, file), 'utf-8');
        for (const line of content.split('\n')) {
          if (!line.trim()) continue;
          try {
            const d = JSON.parse(line);
            if (d.action !== 'finished') continue;
            const sk = d.sessionKey || d.sessionId || d.jobId || 'unknown';


            const u = d.usage || {};
            const tokens = (u.input_tokens || 0) + (u.output_tokens || 0);

            if (!sessions[sk]) {
              sessions[sk] = {
                sessionKey: sk,
                jobName: d.jobName || d.jobId || 'Unknown',
                model: d.model || 'unknown',
                lastRun: typeof d.ts === 'number' ? new Date(d.ts).toISOString() : String(d.ts),
                runs: 0,
                totalTokens: 0,
                totalDuration: 0,
                lastStatus: d.status,
                lastSummary: '',
              };
            }

            sessions[sk].runs += 1;
            sessions[sk].totalTokens += tokens;
            sessions[sk].totalDuration += d.durationMs || 0;
            if ((typeof d.ts === 'number' ? d.ts : new Date(d.ts).getTime()) > new Date(sessions[sk].lastRun).getTime()) {
              sessions[sk].lastRun = typeof d.ts === 'number' ? new Date(d.ts).toISOString() : String(d.ts);
              sessions[sk].lastStatus = d.status;
              sessions[sk].model = d.model || sessions[sk].model;
              sessions[sk].lastSummary = (d.summary || '').slice(0, 200);
            }
            sessions[sk].jobName = d.jobName || sessions[sk].jobName;
          } catch {}
        }
      } catch {}
    }

    const sorted = Object.values(sessions)
      .sort((a, b) => b.lastRun.localeCompare(a.lastRun));

    return NextResponse.json({
      available: true,
      sessions: sorted,
      total: sorted.length,
      note: 'Sessions derived from cron job run logs. Main interactive sessions are not tracked here.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      available: false,
      sessions: [],
      total: 0,
      error: String(err),
      timestamp: new Date().toISOString(),
    });
  }
}
