import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Expect: hospitalId, reportDate, bedsTotal, bedsAvailable, icuTotal, icuAvailable, ventilatorsTotal, ventilatorsAvailable, oxygenAvailable, diseaseCounts
    const { hospitalId, reportDate, bedsTotal, bedsAvailable, icuTotal, icuAvailable, ventilatorsTotal, ventilatorsAvailable, oxygenAvailable, diseaseCounts } = body;

    const result = await pool.query(
      `INSERT INTO capacity_reports 
       (facility_id, report_date, beds_total, beds_available, icu_total, icu_available, ventilators_total, ventilators_available, oxygen_available, disease_counts, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id`,
      [hospitalId, reportDate, bedsTotal, bedsAvailable, icuTotal, icuAvailable, ventilatorsTotal, ventilatorsAvailable, oxygenAvailable, JSON.stringify(diseaseCounts)]
    );

    return NextResponse.json({ success: true, reportId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}