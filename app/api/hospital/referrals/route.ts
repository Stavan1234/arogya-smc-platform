// app/api/hospital/referrals/route.ts
import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
    const { payload } = await jwtVerify(token, secret);
    const facility_id = (payload as any).facility_id;

    const result = await pool.query(
      `SELECT id, patient_name, age, risk_score, status, clinical_notes, referred_by, referred_at, updated_at
       FROM public.high_risk_referrals 
       WHERE facility_id = $1 OR facility_id IS NULL
       ORDER BY risk_score DESC, referred_at DESC`,
      [facility_id]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Referrals fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
    await jwtVerify(token, secret);

    const { referral_id, status, clinical_notes } = await req.json();

    if (!referral_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE public.high_risk_referrals 
       SET status = $1, clinical_notes = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [status, clinical_notes, referral_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Intervention update error:', error);
    return NextResponse.json({ error: 'Intervention update failed' }, { status: 500 });
  }
}

