// app/api/public/facilities/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ward = searchParams.get('ward');

  try {
    let query = `
      SELECT f.id, f.name, f.ward_code, f.location_lat, f.location_lng, f.contact,
             cr.beds_total, cr.beds_available, cr.icu_total, cr.icu_available,
             cr.ventilators_total, cr.ventilators_available, cr.oxygen_available,
             cr.report_date as last_updated
      FROM facilities f
      LEFT JOIN LATERAL (
        SELECT * FROM capacity_reports cr
        WHERE cr.facility_id = f.id
        ORDER BY cr.report_date DESC
        LIMIT 1
      ) cr ON true
    `;
    const params = [];
    if (ward) {
      query += ` WHERE f.ward_code = $1`;
      params.push(ward);
    }
    query += ` ORDER BY f.name`;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}