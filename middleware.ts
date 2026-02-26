/**
 * Middleware — currently pass-through for LAN-only deployment.
 * Add auth verification here when exposing beyond local network.
 */

import { NextResponse } from 'next/server';

export async function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
