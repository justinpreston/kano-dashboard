/**
 * GET /api/config
 * Read OpenClaw config (sanitized, no secrets)
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || '/data';

export async function GET() {
  try {
    const configPath = path.join(WORKSPACE, 'gateway.yaml');
    const config = await fs.readFile(configPath, 'utf8');
    
    // Strip secrets (anything with 'key', 'token', 'password', 'secret')
    const sanitized = config
      .split('\n')
      .map(line => {
        if (/(key|token|password|secret):/i.test(line)) {
          return line.replace(/:\s*.*/, ': [REDACTED]');
        }
        return line;
      })
      .join('\n');

    return NextResponse.json({ config: sanitized });
  } catch (error) {
    console.error('Config read error:', error);
    return NextResponse.json(
      { error: 'Failed to read config' },
      { status: 500 }
    );
  }
}
