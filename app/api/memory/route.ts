/**
 * GET /api/memory
 * Read-only memory files listing
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || '/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  try {
    const memoryDir = path.join(WORKSPACE, 'memory');
    
    // If file param, return content (sanitized path)
    if (file) {
      const safePath = path.resolve(memoryDir, file);
      if (!safePath.startsWith(memoryDir)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
      }
      
      const content = await fs.readFile(safePath, 'utf8');
      return NextResponse.json({ path: file, content });
    }

    // List memory files
    const files = await fs.readdir(memoryDir);
    const memoryFiles = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async (f) => {
          const stats = await fs.stat(path.join(memoryDir, f));
          return {
            name: f,
            path: f,
            lastModified: stats.mtime.toISOString(),
            size: stats.size,
          };
        })
    );

    return NextResponse.json(memoryFiles);
  } catch (error) {
    console.error('Memory read error:', error);
    return NextResponse.json(
      { error: 'Failed to read memory files' },
      { status: 500 }
    );
  }
}
