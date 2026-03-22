// app/api/hospital/inventory/distribute/route.ts
import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function POST(req: Request) {
  try {
    // Fix cookie parsing
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const facilityId = (payload as any).facility_id;

    const { resource_type, ward_code, quantity_distributed, beneficiary_type } = await req.json();

    // Validate required fields
    if (!resource_type || !ward_code || !quantity_distributed || !beneficiary_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.query('BEGIN');

    // 1. Log the distribution into the orphaned table
    await pool.query(
      `INSERT INTO public.inventory_distribution_logs 
      (ward_code, resource_type, quantity_distributed, beneficiary_type, report_date) 
      VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
      [ward_code, resource_type, quantity_distributed, beneficiary_type]
    );

    // 2. Call the existing stored procedure to decrement stock & audit log
    await pool.query(
      `CALL public.update_inventory_after_distribution($1, $2, $3)`,
      [facilityId, resource_type, quantity_distributed]
    );

    await pool.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Distribution error:', error);
    return NextResponse.json({ error: 'Distribution failed' }, { status: 500 });
  }
}