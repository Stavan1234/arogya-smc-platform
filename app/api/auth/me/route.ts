import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(request: Request) {
  try {
    const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const facilityId = payload.facility_id as number;
    const role = payload.role as string;

    // Optionally fetch additional user info
    const user = await pool.query(
      'SELECT id, username, full_name, role, facility_id FROM users WHERE id = $1',
      [payload.id]
    );

    return NextResponse.json({
      id: user.rows[0]?.id,
      username: user.rows[0]?.username,
      fullName: user.rows[0]?.full_name,
      role,
      facilityId
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}