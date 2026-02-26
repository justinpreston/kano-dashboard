/**
 * POST /api/auth/login
 * Simple JWT-based authentication
 */

import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import * as bcrypt from 'bcryptjs';

const SECRET = process.env.JWT_SECRET || 'changeme';
const PASSWORD_HASH = process.env.DASHBOARD_PASSWORD_HASH || '';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // Verify password
    const isValid = PASSWORD_HASH 
      ? await bcrypt.compare(password, PASSWORD_HASH)
      : password === process.env.DASHBOARD_PASSWORD;

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create JWT
    const token = await new SignJWT({ authenticated: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(new TextEncoder().encode(SECRET));

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
