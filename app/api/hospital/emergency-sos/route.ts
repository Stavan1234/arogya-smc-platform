// app/api/hospital/emergency-sos/route.ts
import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function POST(req: Request) {
  try {
    // Fix cookie parsing
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const facilityId = (payload as any).facility_id;

    // Get the facility's ward to target the alert correctly
    const facilityRes = await pool.query(
      `SELECT ward_code, name FROM facilities WHERE id = $1`,
      [facilityId]
    );

    // Fix: Check if facility exists and extract data properly
    if (facilityRes.rows.length === 0) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }

    const facility = facilityRes.rows[0]; // Get the first row, not the array

    const { category, severity, message } = await req.json();

    // Validate required fields
    if (!category || !severity || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.query('BEGIN');

    // 1. Override Facility Status if it's an Oxygen emergency
    if (category === 'Oxygen Depletion') {
      await pool.query(
        `UPDATE public.facilities SET oxygen_status = 'CRITICAL', updated_at = NOW() WHERE id = $1`,
        [facilityId]
      );
    }

    // 2. Inject directly into the Municipal Command Alerts Queue
    await pool.query(
      `INSERT INTO public.alerts (type, severity, ward_code, title, description, status) 
       VALUES ('resource', $1, $2, $3, $4, 'active')`,
      [severity, facility.ward_code, `EMERGENCY: ${facility.name} - ${category}`, message]
    );

    await pool.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('SOS trigger error:', error);
    return NextResponse.json({ error: 'SOS trigger failed' }, { status: 500 });
  }
}