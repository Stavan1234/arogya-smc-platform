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

    await pool.query('BEGIN');

    // Insert critical SOS alert visible to MO Dashboard
    const alertResult = await pool.query(
      `INSERT INTO public.alerts (type, severity, facility_id, ward_code, title, description, status, generated_at)
       VALUES ('infrastructure', 'critical', $1, 'GLOBAL', 'SOS OVERRIDE - Critical Infrastructure Failure', 
       'Hospital triggered emergency SOS override. Immediate state-level intervention required.', 'active', NOW())
       RETURNING id, generated_at`,
      [facility_id]
    );

    const alertId = alertResult.rows[0].id;

    // Audit log the SOS
    await pool.query(
      `INSERT INTO public.audit_logs (facility_id, user_role, action, resource_id, details)
       VALUES ($1, 'HOSPITAL', 'SOS_OVERRIDE', $2, 'Critical infrastructure failure flagged')`,
      [facility_id, alertId]
    );

    await pool.query('COMMIT');

    // Trigger notification event (if event system exists)
    // await fetch('/api/events', { method: 'POST', body: JSON.stringify({ event: 'SOS_EMERGENCY', facility_id, alert_id: alertId }) });

    return NextResponse.json({ 
      success: true, 
      message: 'SOS override flagged successfully. State dashboard notified.',
      alert_id: alertId 
    });
    
  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.error('SOS error:', error);
    return NextResponse.json({ error: 'Failed to trigger SOS' }, { status: 500 });
  }
}

