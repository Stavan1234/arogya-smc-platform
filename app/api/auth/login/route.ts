import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key-change-in-production'; // Store in env later

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // For prototype, we'll have a simple bypass: if username is 'demo' and password 'demo', return a fake token
    // But let's implement real check with DB if you added users.
    
    // In real scenario:
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, ward_code: user.ward_code },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set cookie
    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set('token', token, { httpOnly: true, path: '/' });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}