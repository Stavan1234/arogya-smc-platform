import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendMulticast } from '@/lib/firebase';
import { eventEmitter } from '@/lib/eventEmitter';

const TRIGGER_SECRET = process.env.NOTIFICATION_TRIGGER_SECRET;

export async function POST(request: Request) {
  try {
    const { secret, type, recordId } = await request.json();
    if (secret !== TRIGGER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let alertData: any = null;
    let title = '';
    let body = '';

    if (type === 'anomaly') {
      const res = await pool.query('SELECT * FROM anomaly_events WHERE id = $1', [recordId]);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      alertData = res.rows[0];
      title = `Anomaly Detected in Ward ${alertData.ward_code}`;
      body = alertData.description;
    } else if (type === 'outbreak') {
      const res = await pool.query('SELECT * FROM outbreak_events WHERE id = $1', [recordId]);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      alertData = res.rows[0];
      title = `Outbreak Alert: ${alertData.disease_type}`;
      body = `Ward ${alertData.ward_code}: ${alertData.last_update}`;
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Fetch device tokens for relevant users (e.g., all admins or ward officers)
    const tokensRes = await pool.query(`
      SELECT dt.token FROM device_tokens dt
      JOIN users u ON dt.user_id = u.id
      WHERE u.role IN ('CMO', 'Deputy-CMO', 'Nagar-Swasthya')
    `);
    const tokens = tokensRes.rows.map(r => r.token);
    if (tokens.length > 0) {
      await sendMulticast(tokens, title, body, { type, recordId });
    }

    // Emit event for SSE
    eventEmitter.emit('newAlert', { type, data: alertData });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification trigger error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}