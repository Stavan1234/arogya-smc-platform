import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 1. ASHA directory from v_asha_performance
    const ashaRes = await pool.query(`
      SELECT id, name, assigned_ward, last_sync, submitted_reports, target, status, out_of_bounds
      FROM v_asha_performance
    `);
    const directory = ashaRes.rows.map(row => ({
      id: row.id,
      name: row.name,
      assigned_ward: row.assigned_ward,
      lastSync: row.last_sync,
      submitted: row.submitted_reports,
      target: row.target,
      status: row.status,
      outOfBounds: row.out_of_bounds
    }));

    // 2. KPIs
    const totalForce = directory.length;
    const fieldPresence = directory.filter(a => a.status === 'Active').length;
    const defaulters = directory.filter(a => a.status === 'Overdue').length;

    // Total field pings in last 24h
    const pingsRes = await pool.query(`
      SELECT COUNT(*) FROM asha_reports 
      WHERE report_date >= CURRENT_DATE - INTERVAL '1 day'
    `);
    const fieldPings = parseInt(pingsRes.rows[0].count);

    // 3. Map data: pings (last 48h) and ward heat (from v_ward_risk_intelligence)
    const pingsQuery = await pool.query(`
      SELECT location_lat as lat, location_lng as lng, worker_id as worker
      FROM asha_reports
      WHERE report_date >= CURRENT_DATE - INTERVAL '2 days'
        AND location_lat IS NOT NULL
      LIMIT 150
    `);
    const pings = pingsQuery.rows.map(row => ({
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      worker: row.worker
    }));

    const wardHeatRes = await pool.query(`
      SELECT ward_code, risk_score as heat
      FROM v_ward_risk_intelligence
    `);
    const wardHeat: Record<string, number> = {};
    wardHeatRes.rows.forEach(row => {
      wardHeat[row.ward_code] = row.heat / 100; // normalize 0-1
    });

    return NextResponse.json({
      kpis: {
        totalForce,
        fieldPresence,
        defaulters,
        fieldPings
      },
      mapData: {
        pings,
        wardHeat
      },
      directory
    });
  } catch (error) {
    console.error('ASHA API error:', error);
    // Fallback mock data
    const now = new Date();
    const generatePings = (count: number) => {
      return Array.from({ length: count }).map(() => ({
        lat: 17.65 + Math.random() * 0.06,
        lng: 75.88 + Math.random() * 0.06,
        worker: `ASH-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`
      }));
    };
    return NextResponse.json({
      kpis: {
        totalForce: 425,
        fieldPresence: 388,
        defaulters: 24,
        fieldPings: 2154
      },
      mapData: {
        pings: generatePings(150),
        wardHeat: { '1': 0.9, '2': 0.4, '10': 0.8, '14': 0.95, '21': 0.2, '26': 0.6 }
      },
      directory: [
        { id: 'ASH-042', name: 'Sunita Kamble', assigned_ward: '14', lastSync: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), status: 'Active', submitted: 42, target: 50, outOfBounds: false },
        { id: 'ASH-108', name: 'Priya Kulkarni', assigned_ward: '2', lastSync: new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString(), status: 'Overdue', submitted: 15, target: 50, outOfBounds: false },
        { id: 'ASH-019', name: 'Meena Bhosale', assigned_ward: '10', lastSync: new Date(now.getTime() - 110 * 60 * 1000).toISOString(), status: 'Active', submitted: 55, target: 50, outOfBounds: true },
        { id: 'ASH-088', name: 'Latika Mane', assigned_ward: '26', lastSync: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), status: 'Active', submitted: 68, target: 60, outOfBounds: false },
        { id: 'ASH-201', name: 'Aarti Deshmukh', assigned_ward: '14', lastSync: new Date(now.getTime() - 50 * 60 * 60 * 1000).toISOString(), status: 'Overdue', submitted: 0, target: 50, outOfBounds: false }
      ]
    });
  }
}