import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Sessions API — OpenClaw tracks sessions in-memory only.
 * No file-based session store exists. Returns placeholder.
 * 
 * TODO: Proxy to OpenClaw gateway API when internal API is available.
 */
export async function GET() {
  return NextResponse.json({
    available: false,
    message: 'Sessions are tracked in-memory by OpenClaw. No file-based session data available.',
    sessions: [],
    timestamp: new Date().toISOString(),
  });
}
