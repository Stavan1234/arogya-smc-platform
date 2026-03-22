import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7');
  const ward = searchParams.get('ward'); // optional

  try {
    let query = `
      SELECT 
        report_date as date,
        SUM(fever_count) as fever,
        SUM(cough_count) as cough,
        SUM(diarrhea_count) as diarrhea,
        SUM(fever_count + cough_count + diarrhea_count) as total_cases
      FROM asha_reports
      WHERE report_date >= CURRENT_DATE - $1::interval
    `;
    const params: (string | number)[] = [`${days} days`];
    if (ward) {
      query += ` AND ward_code = $2`;
      params.push(ward);
    }
    query += ` GROUP BY report_date ORDER BY report_date ASC`;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}