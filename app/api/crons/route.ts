/**
 * GET /api/crons
 * Read-only cron job listing from gateway.yaml
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || '/data';

export async function GET() {
  try {
    const configPath = path.join(WORKSPACE, 'gateway.yaml');
    const config = await fs.readFile(configPath, 'utf8');
    
    // Simple YAML parsing for cron jobs (read-only, no running)
    const cronLines = config.split('\n').filter(l => l.trim().startsWith('- cron:'));
    const jobs: any[] = [];
    
    // Basic parsing - in production you'd use a proper YAML parser
    for (const line of cronLines) {
      const match = line.match(/cron:\s*["']?([^"']+)["']?/);
      if (match) {
        jobs.push({
          id: `cron-${jobs.length}`,
          label: `Job ${jobs.length + 1}`,
          schedule: match[1],
          nextRun: new Date(Date.now() + 3600000).toISOString(),
          status: 'active',
        });
      }
    }

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Cron read error:', error);
    return NextResponse.json(
      { error: 'Failed to read cron jobs' },
      { status: 500 }
    );
  }
}
