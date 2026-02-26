import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Costs API — Currently no usage tracking DB exists.
 * Gateway.db is 0 bytes. This returns a placeholder until
 * OpenClaw adds proper usage tracking.
 * 
 * TODO: Read from gateway.db or OpenClaw API when available.
 */
export async function GET() {
  return NextResponse.json({
    available: false,
    message: 'No usage tracking database found. Cost tracking will be available when OpenClaw exposes session usage data.',
    costs: {
      today: null,
      thisWeek: null,
      thisMonth: null,
      byModel: [],
      byJob: [],
    },
    timestamp: new Date().toISOString(),
  });
}
