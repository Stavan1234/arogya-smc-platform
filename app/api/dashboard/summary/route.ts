import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const wardsCount = await pool.query('SELECT COUNT(*) FROM wards');
    const highRiskWards = await pool.query(
      `SELECT COUNT(DISTINCT ward_code) FROM alerts WHERE severity IN ('high', 'critical') AND status = 'active'`
    );
    const activeAlerts = await pool.query(
      `SELECT COUNT(*) FROM alerts WHERE status = 'active'`
    );
    const bedsAvailable = await pool.query(
      `SELECT COALESCE(SUM(beds_available), 0) as sum FROM capacity_reports WHERE report_date = CURRENT_DATE`
    );

    return NextResponse.json({
      totalWards: parseInt(wardsCount.rows[0].count),
      highRiskWards: parseInt(highRiskWards.rows[0].count),
      activeAlerts: parseInt(activeAlerts.rows[0].count),
      totalBedsAvailable: parseInt(bedsAvailable.rows[0].sum),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}