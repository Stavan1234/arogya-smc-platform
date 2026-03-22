import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 1. Get ward data (for population)
    const wardsRes = await pool.query(`SELECT code, name, total_population FROM wards`);
    const wardMap: Record<string, any> = {};
    wardsRes.rows.forEach(w => {
      wardMap[w.code] = { name: w.name, population: w.total_population };
    });

    // 2. Burn rate data from v_inventory_burn_rate
    const burnRateRes = await pool.query(`
      SELECT ward_code, resource_type, current_stock, daily_consumption, days_until_depletion
      FROM v_inventory_burn_rate
    `);

    // Build supplyHeatmap with required fields
    const supplyHeatmap: Record<string, any> = {};
    burnRateRes.rows.forEach(row => {
      const ward = wardMap[row.ward_code] || { name: `Ward ${row.ward_code}`, population: 10000 };
      supplyHeatmap[row.ward_code] = {
        name: ward.name,
        population: ward.population,
        resource_type: row.resource_type,
        currentStock: row.current_stock,
        dailyConsumption: row.daily_consumption,
        daysUntilDepletion: row.days_until_depletion,
        requiredThreshold: Math.floor(ward.population * 0.05), // 5% of population as threshold
        isSufficient: row.days_until_depletion > 10,
        color: row.days_until_depletion < 2 ? '#ef4444' : row.days_until_depletion < 10 ? '#f59e0b' : '#22c55e'
      };
    });

    // 3. Demand forecasts
    const forecastRes = await pool.query(`
      SELECT ward_code, resource_type, forecast_date, predicted_demand
      FROM resource_demand_forecast
      WHERE forecast_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
      ORDER BY ward_code, forecast_date
    `);

    // 4. Distribution logs (if table exists)
    let distributionLog: any[] = [];
    try {
      const distRes = await pool.query(`
        SELECT id, ward_code, resource_type, quantity_distributed, beneficiary_type, report_date
        FROM inventory_distribution_logs
        ORDER BY report_date DESC
        LIMIT 10
      `);
      distributionLog = distRes.rows.map(row => ({
        id: row.id,
        ward_no: row.ward_code,
        resource: row.resource_type,
        target: row.quantity_distributed,
        distributed: row.quantity_distributed,
        compliance: 100 // or compute based on target
      }));
    } catch (err) {
      // table may not exist; ignore
    }

    // 5. KPI Metrics (static for now)
    const kpiMetrics = {
      vaccineColdChain: { stock: 12500, target: 15000, status: 'Green' },
      maternalKits: { balance: 3420, status: 'Yellow' },
      childSupplements: { ashaHands: 8900, status: 'Green' },
      emergencyAssets: { activeO2: 450, ambulances: 42, status: 'Red' }
    };

    return NextResponse.json({
      kpiMetrics,
      supplyHeatmap,
      distributionLog,
      forecast: forecastRes.rows
    });
  } catch (error) {
    console.error('Resources API error:', error);
    // Fallback mock that includes the required fields
    const wards = Array.from({ length: 26 }, (_, i) => ({
      code: String(i+1),
      name: `Ward ${i+1}`,
      population: 25000 + Math.random() * 50000
    }));
    const supplyHeatmapMock: Record<string, any> = {};
    wards.forEach(w => {
      const isSufficient = Math.random() > 0.4;
      supplyHeatmapMock[w.code] = {
        name: w.name,
        population: w.population,
        resource_type: 'ORS',
        currentStock: Math.floor(Math.random() * 2000),
        dailyConsumption: Math.floor(Math.random() * 100),
        daysUntilDepletion: Math.floor(Math.random() * 30),
        requiredThreshold: Math.floor(w.population * 0.05),
        isSufficient,
        color: isSufficient ? '#22c55e' : '#ef4444'
      };
    });
    return NextResponse.json({
      kpiMetrics: {
        vaccineColdChain: { stock: 12500, target: 15000, status: 'Green' },
        maternalKits: { balance: 3420, status: 'Yellow' },
        childSupplements: { ashaHands: 8900, status: 'Green' },
        emergencyAssets: { activeO2: 450, ambulances: 42, status: 'Red' }
      },
      supplyHeatmap: supplyHeatmapMock,
      distributionLog: [],
      forecast: []
    });
  }
}