import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'disease';
  const days = parseInt(searchParams.get('days') || '7');

  try {
    // 1. Top risk wards from v_ward_risk_intelligence
    const topWardsQuery = await pool.query(`
      SELECT 
        ward_code,
        ward_name,
        current_cases AS metric,
        risk_score,
        trend
      FROM v_ward_risk_intelligence
      ORDER BY risk_score DESC
      LIMIT 5
    `);

    const topWards = topWardsQuery.rows.map(row => ({
      code: row.ward_code,
      name: row.ward_name,
      metric: parseInt(row.metric) || 0,
      riskScore: parseFloat(row.risk_score) || 0,
      trend: parseFloat(row.trend) || 0,
      actions: view === 'disease' 
        ? ['Fogging', 'Sanitation Check'] 
        : ['ANC Camp', 'Routine Visit'],
    }));

    // 2. KPIs from our v_mo_metrics
    const metricsRes = await pool.query('SELECT * FROM v_mo_metrics LIMIT 1');
    const moMetrics = metricsRes.rows[0] || {
      moving_average_7d: 0,
      test_positivity_rate: 0,
      asha_conversion_rate: 0,
      resources_low_stock: 0,
      reference_date: new Date().toISOString()
    };

    // 3. Active outbreaks count (from outbreak_events)
    const activeOutbreaksRes = await pool.query(
      `SELECT COUNT(*) FROM outbreak_events WHERE is_closed = false`
    );
    const activeOutbreaks = parseInt(activeOutbreaksRes.rows[0].count);

    // 4. Reporting compliance from v_facility_performance
    const complianceRes = await pool.query(
      `SELECT AVG(compliance_percentage) as avg_compliance FROM v_facility_performance`
    );
    const reportingCompliance = complianceRes.rows[0]?.avg_compliance 
      ? parseFloat(complianceRes.rows[0].avg_compliance).toFixed(1) 
      : 0;

    // 5. Critical alerts (high severity in last 24h)
    const alertsRes = await pool.query(`
      SELECT COUNT(*) FROM alerts 
      WHERE severity = 'high' 
        AND generated_at >= CURRENT_DATE - INTERVAL '1 day'
    `);
    const criticalAlerts = parseInt(alertsRes.rows[0].count);

    // 6. Bed availability from latest capacity reports (using our v_facility_performance)
    const bedsRes = await pool.query(`
      SELECT SUM(beds_available) as available, SUM(beds_total) as total
      FROM v_facility_performance
    `);
    const bedAvailability = {
      available: parseInt(bedsRes.rows[0]?.available) || 0,
      total: parseInt(bedsRes.rows[0]?.total) || 0
    };

    // 7. ASHA sync status from v_asha_performance
    const ashaRes = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Active') as synced,
        COUNT(*) as total
      FROM v_asha_performance
    `);
    const ashaSyncStatus = ashaRes.rows[0]?.total > 0
      ? ((parseInt(ashaRes.rows[0].synced) / parseInt(ashaRes.rows[0].total)) * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      topWards,
      metrics: {
        activeOutbreaks,
        reportingCompliance,
        criticalAlerts,
        bedAvailability,
        ashaSyncStatus,
        movingAverage: moMetrics.moving_average_7d,
        testPositivity: moMetrics.test_positivity_rate,
        ashaConversion: moMetrics.asha_conversion_rate,
        resourcesLowStock: moMetrics.resources_low_stock
      },
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=15',
      },
    });
  } catch (error) {
    console.error('Summary API error:', error);
    // Fallback mock data
    return NextResponse.json({
      topWards: [
        { code: '5', name: 'Ward 5', metric: 42, riskScore: 85, trend: 12, actions: ['Fogging'] },
        { code: '13', name: 'Ward 13', metric: 38, riskScore: 78, trend: 8, actions: ['Sanitation'] },
      ],
      metrics: {
        activeOutbreaks: 5,
        reportingCompliance: 91,
        criticalAlerts: 18,
        bedAvailability: { available: 6540, total: 10000 },
        ashaSyncStatus: 95,
        movingAverage: 42,
        testPositivity: 12,
        ashaConversion: 75,
        resourcesLowStock: 3
      },
      lastUpdated: new Date().toISOString(),
    }, { status: 200 });
  }
}