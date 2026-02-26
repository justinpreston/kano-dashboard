/**
 * GET /api/sessions
 * Read-only sessions from OpenClaw SQLite DB
 */

import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import * as path from 'path';

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || '/data';

export async function GET() {
  try {
    const dbPath = path.join(WORKSPACE, 'gateway.db');
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });

    const sessions = db.prepare(`
      SELECT 
        key,
        label,
        created_at,
        updated_at,
        message_count,
        token_usage
      FROM sessions
      ORDER BY updated_at DESC
      LIMIT 100
    `).all();

    db.close();

    return NextResponse.json(
      sessions.map((s: any) => ({
        id: s.key,
        label: s.label || 'Unnamed',
        created: s.created_at,
        lastActivity: s.updated_at,
        messageCount: s.message_count || 0,
        tokenUsage: s.token_usage || 0,
      }))
    );
  } catch (error) {
    console.error('Sessions read error:', error);
    return NextResponse.json(
      { error: 'Failed to read sessions' },
      { status: 500 }
    );
  }
}
