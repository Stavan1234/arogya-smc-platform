import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || '';
    const decoded = jwt.verify(token, secret) as any;

    if (decoded.role !== 'HOSPITAL' || !decoded.facility_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { facility_id } = decoded;

    const result = await pool.query(
      `SELECT * FROM public.v_hospital_dashboard WHERE facility_id = $1`,
      [facility_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error: any) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
