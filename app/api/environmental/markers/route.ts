import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    console.log('Environmental markers API - fetching for days:', days);

    const result = await pool.query(`
      SELECT 
        id,
        ward_code,
        location_lat,
        location_lng,
        environmental_flags,
        report_date
      FROM asha_reports
      WHERE report_date > CURRENT_DATE - $1::interval
        AND environmental_flags IS NOT NULL
        AND location_lat IS NOT NULL
        AND location_lng IS NOT NULL
    `, [`${days} days`]);

    console.log('Found', result.rows.length, 'environmental reports');

    // Parse the environmental_flags JSON for each row
    const markers = result.rows.map(row => ({
      id: row.id,
      wardCode: row.ward_code,
      lat: parseFloat(row.location_lat),
      lng: parseFloat(row.location_lng),
      flags: row.environmental_flags, // already JSON
      date: row.report_date,
    }));

    return NextResponse.json(markers, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Environmental markers API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
