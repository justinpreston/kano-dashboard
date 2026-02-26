/**
 * GET /api/costs
 * Read-only usage and cost data
 */

import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import * as path from 'path';

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || '/data';

export async function GET() {
  try {
    const dbPath = path.join(WORKSPACE, 'gateway.db');
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });

    const usage = db.prepare(`
      SELECT 
        model,
        SUM(prompt_tokens + completion_tokens) as tokens,
        SUM(cost) as cost
      FROM usage
      GROUP BY model
      ORDER BY cost DESC
    `).all();

    const totals = db.prepare(`
      SELECT 
        SUM(prompt_tokens + completion_tokens) as total_tokens,
        SUM(cost) as total_cost
      FROM usage
    `).get() as any;

    db.close();

    return NextResponse.json({
      totalCost: totals?.total_cost || 0,
      totalTokens: totals?.total_tokens || 0,
      breakdown: usage,
    });
  } catch (error) {
    console.error('Cost read error:', error);
    return NextResponse.json(
      {
        totalCost: 0,
        totalTokens: 0,
        breakdown: [],
      },
      { status: 200 }
    );
  }
}
