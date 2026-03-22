import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hospitalId, reportDate, bedsTotal, bedsAvailable, icuTotal, icuAvailable, ventilatorsTotal, ventilatorsAvailable, oxygenAvailable, diseaseCounts } = body;

    // Insert report
    const result = await pool.query(
      `INSERT INTO capacity_reports 
       (facility_id, report_date, beds_total, beds_available, icu_total, icu_available, ventilators_total, ventilators_available, oxygen_available, disease_counts, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id`,
      [hospitalId, reportDate, bedsTotal, bedsAvailable, icuTotal, icuAvailable, ventilatorsTotal, ventilatorsAvailable, oxygenAvailable, JSON.stringify(diseaseCounts)]
    );

    // Log audit
    await logAudit(request, 'INSERT', 'capacity_reports', result.rows[0].id, null, body);

    return NextResponse.json({ success: true, reportId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}