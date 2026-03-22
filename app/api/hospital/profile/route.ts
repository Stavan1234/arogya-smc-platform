import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function PATCH(req: Request) {
  try {
    // Standard JWT extraction
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/token=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const facilityId = payload.facility_id; // Assumes facility_id is in JWT payload

    const { specialties, doctors } = await req.json();

    const result = await pool.query(
      `UPDATE public.facilities SET specialties = $1::jsonb, doctors = $2::jsonb, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [JSON.stringify(specialties), JSON.stringify(doctors), facilityId]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Profile update failed:', error);
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
  }
}
