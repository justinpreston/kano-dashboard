import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const STATE_DIR = process.env.OPENCLAW_STATE || '/openclaw-state';

export async function GET() {
  try {
    const configPath = join(STATE_DIR, 'openclaw.json');
    const raw = await readFile(configPath, 'utf-8');
    const config = JSON.parse(raw);

    // Sanitize — strip secrets, tokens, passwords
    const sanitized = {
      version: config.version,
      agents: config.agents ? {
        defaultModel: config.agents.defaultModel,
        instances: (config.agents.instances || []).map((a: Record<string, unknown>) => ({
          id: a.id,
          model: a.model,
        })),
      } : undefined,
      channels: Object.keys(config.channels || {}).map(ch => ({
        name: ch,
        enabled: true,
      })),
      cron: config.cron ? {
        enabled: config.cron.enabled !== false,
        heartbeatMs: config.cron.heartbeatMs,
      } : undefined,
      skills: Array.isArray(config.skills)
        ? config.skills.map((s: Record<string, unknown>) => s.name || s)
        : undefined,
    };

    return NextResponse.json({
      config: sanitized,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
