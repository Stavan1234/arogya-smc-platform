import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
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
    const body = await request.json();
    
    const {
      beds_total, beds_available, icu_total, icu_available,
      ventilators_total, ventilators_available, oxygen_available,
      disease_counts
    } = body;

    const report_date = new Date().toISOString().split('T')[0];

    // Check if report already exists for today
    const existing = await pool.query(
      `SELECT id FROM public.capacity_reports WHERE facility_id = $1 AND report_date = $2`,
      [facility_id, report_date]
    );

    if (existing.rows.length > 0) {
      // Update existing
      await pool.query(
        `UPDATE public.capacity_reports SET
          beds_total = $1, beds_available = $2, icu_total = $3, icu_available = $4,
          ventilators_total = $5, ventilators_available = $6, oxygen_available = $7,
          disease_counts = $8::jsonb
        WHERE id = $9`,
        [
          beds_total, beds_available, icu_total, icu_available,
          ventilators_total, ventilators_available, oxygen_available,
          JSON.stringify(disease_counts || {}),
          existing.rows[0].id
        ]
      );
    } else {
      // Insert new
      await pool.query(
        `INSERT INTO public.capacity_reports (
          facility_id, report_date, beds_total, beds_available, 
          icu_total, icu_available, ventilators_total, ventilators_available,
          oxygen_available, disease_counts
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
        [
          facility_id, report_date, beds_total, beds_available,
          icu_total, icu_available, ventilators_total, ventilators_available,
          oxygen_available, JSON.stringify(disease_counts || {})
        ]
      );
    }

    return NextResponse.json({ success: true, message: 'Capacity report saved successfully' });
    
  } catch (error: any) {
    console.error('Capacity report error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

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
    const report_date = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT * FROM public.capacity_reports WHERE facility_id = $1 AND report_date = $2`,
      [facility_id, report_date]
    );

    return NextResponse.json({
      success: true,
      data: result.rows.length > 0 ? result.rows[0] : null
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
