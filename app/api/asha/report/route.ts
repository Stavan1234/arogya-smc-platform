import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Expect body to contain: workerId, wardCode, reportDate, feverCount, coughCount, diarrheaCount, maternalRiskFlags, childRiskFlags, environmentalFlags, locationLat, locationLng
    const { workerId, wardCode, reportDate, feverCount, coughCount, diarrheaCount, maternalRiskFlags, childRiskFlags, environmentalFlags, locationLat, locationLng } = body;

    const result = await pool.query(
      `INSERT INTO asha_reports 
       (worker_id, ward_code, report_date, fever_count, cough_count, diarrhea_count, maternal_risk_flags, child_risk_flags, environmental_flags, location_lat, location_lng, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING id`,
      [workerId, wardCode, reportDate, feverCount, coughCount, diarrheaCount, JSON.stringify(maternalRiskFlags), JSON.stringify(childRiskFlags), JSON.stringify(environmentalFlags), locationLat, locationLng]
    );

    await logAudit(request, 'INSERT', 'asha_reports', result.rows[0].id, null, body);
    return NextResponse.json({ success: true, reportId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}