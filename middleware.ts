/**
 * Auth verification middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = process.env.JWT_SECRET || 'changeme';

export async function middleware(request: NextRequest) {
  // All API routes are read-only and served on LAN only.
  // Auth will be added when exposed beyond localhost.
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
