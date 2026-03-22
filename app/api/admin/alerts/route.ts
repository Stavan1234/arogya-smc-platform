import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { type, severity, ward_code, title, description } = await req.json();
    
    // 1. Insert into database
    const alertResult = await pool.query(
      `INSERT INTO public.alerts (type, severity, ward_code, title, description, status) 
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
      [type, severity, ward_code, title, description]
    );

    const newAlert = alertResult.rows[0];

    // 2. Trigger FCM Push Notifications
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notification/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.NOTIFICATION_TRIGGER_SECRET,
        type: newAlert?.type,
        recordId: newAlert?.id
      })
    });

    return NextResponse.json({ success: true, data: newAlert });
  } catch (error) {
    console.error('Alert dispatch failed:', error);
    return NextResponse.json({ error: 'Alert dispatch failed' }, { status: 500 });
  }
}
