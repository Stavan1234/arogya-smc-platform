import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 1. Get active outbreaks from outbreak_events
    const outbreaksRes = await pool.query(`
      SELECT 
        id,
        ward_code,
        disease_type as disease,
        status,
        declared_date as generated_at,
        center_lat,
        center_lng,
        containment_radius_meters,
        last_update as note
      FROM outbreak_events
      WHERE is_closed = false
      ORDER BY declared_date DESC
    `);

    // 2. Get predictions for next 7 days from outbreak_predictions
    const predictionsRes = await pool.query(`
      SELECT ward_code, prediction_date, predicted_cases
      FROM outbreak_predictions
      WHERE prediction_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
      ORDER BY ward_code, prediction_date
    `);
    const predictionsByWard: Record<string, any[]> = {};
    predictionsRes.rows.forEach(p => {
      if (!predictionsByWard[p.ward_code]) predictionsByWard[p.ward_code] = [];
      predictionsByWard[p.ward_code].push({
        date: p.prediction_date,
        cases: p.predicted_cases
      });
    });

    // 3. Build outbreaks array
    const outbreaks = outbreaksRes.rows.map(row => ({
      id: row.id,
      ward: `Ward ${row.ward_code}`,
      ward_code: row.ward_code,
      disease: row.disease,
      note: row.note || 'Active outbreak.',
      age: Math.max(0, Math.floor((new Date().getTime() - new Date(row.generated_at).getTime()) / (1000 * 60 * 60 * 24))),
      status: row.status === 'active' ? 'Active' : row.status === 'investigative' ? 'Investigative' : 'Contained',
      lat: row.center_lng ? parseFloat(row.center_lng) : null, // DB stored lng in center_lat
      lng: row.center_lat ? parseFloat(row.center_lat) : null, // DB stored lat in center_lng
      predictions: predictionsByWard[row.ward_code] || []
    }));

    // 4. Metrics
    const metricsRes = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status IN ('active', 'investigative')) as active,
        COUNT(*) as total
      FROM outbreak_events
    `);
    const activeOutbreaks = parseInt(metricsRes.rows[0].active);
    const totalOutbreaks = parseInt(metricsRes.rows[0].total);
    const containmentSuccessRate = totalOutbreaks > 0 
      ? Math.round((totalOutbreaks - activeOutbreaks) / totalOutbreaks * 100) 
      : 0;

    // 5. Top high-risk ward from v_ward_risk_intelligence
    const topWardRes = await pool.query(`
      SELECT ward_code, ward_name
      FROM v_ward_risk_intelligence
      ORDER BY risk_score DESC
      LIMIT 1
    `);
    const topHighRiskWard = topWardRes.rows[0] 
      ? `Ward ${topWardRes.rows[0].ward_code} (${topWardRes.rows[0].ward_name})` 
      : 'None';

    return NextResponse.json({
      outbreaks,
      metrics: {
        activeOutbreaks,
        containmentSuccessRate,
        topHighRiskWard
      }
    });
  } catch (error) {
    console.error('Outbreaks API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}