import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        ward_code, 
        detection_date, 
        observed_cases, 
        expected_cases, 
        deviation_score, 
        description, 
        generated_at
      FROM anomaly_events
      ORDER BY detection_date DESC, generated_at DESC
      LIMIT 10
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Anomalies API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}