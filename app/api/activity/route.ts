/**
 * GET /api/activity
 * Read-only activity log from activities.db
 */

import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import * as path from 'path';

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || '/data';

export async function GET() {
  try {
    const dbPath = path.join(WORKSPACE, 'activities.db');
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });

    const activities = db.prepare(`
      SELECT 
        id,
        timestamp,
        type,
        description,
        status
      FROM activities
      ORDER BY timestamp DESC
      LIMIT 100
    `).all();

    db.close();

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Activity read error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
