import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logAudit } from '@/lib/audit';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}
// TypeScript now knows JWT_SECRET is a string
const secret: string = JWT_SECRET;

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Fetch user with role-specific fields
    const userResult = await pool.query(
      `SELECT id, username, password_hash, full_name, role, ward_code, facility_id
       FROM users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create token with all necessary claims
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        ward_code: user.ward_code,
        facility_id: user.facility_id,
      },
      secret as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Log audit event – cast request to NextRequest
    await logAudit(request as NextRequest, 'LOGIN', 'users', user.id);

    const response = NextResponse.json({
      success: true,
      role: user.role,
      name: user.full_name,
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}