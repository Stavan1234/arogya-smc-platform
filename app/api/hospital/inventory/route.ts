import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || '';
    const decoded = jwt.verify(token, secret) as any;

    if (decoded.role !== 'HOSPITAL' || !decoded.facility_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { facility_id } = decoded;
    const body = await request.json();
    
    const { resource_type, current_stock, min_threshold } = body;

    if (!resource_type || current_stock === undefined || min_threshold === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert inventory
    const existing = await pool.query(
      `SELECT id FROM public.facility_inventory WHERE facility_id = $1 AND resource_type = $2`,
      [facility_id, resource_type]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE public.facility_inventory SET 
          current_stock = $1, min_threshold = $2, last_updated = NOW() 
         WHERE id = $3`,
        [current_stock, min_threshold, existing.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO public.facility_inventory (facility_id, resource_type, current_stock, min_threshold) 
         VALUES ($1, $2, $3, $4)`,
        [facility_id, resource_type, current_stock, min_threshold]
      );
    }

    return NextResponse.json({ success: true, message: 'Inventory updated successfully' });
    
  } catch (error: any) {
    console.error('Inventory report error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || '';
    const decoded = jwt.verify(token, secret) as any;

    if (decoded.role !== 'HOSPITAL' || !decoded.facility_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { facility_id } = decoded;

    const result = await pool.query(
      `SELECT id, resource_type, current_stock, min_threshold, last_updated 
       FROM public.facility_inventory WHERE facility_id = $1 ORDER BY resource_type ASC`,
      [facility_id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
