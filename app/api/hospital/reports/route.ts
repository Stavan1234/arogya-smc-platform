import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get('hospitalId'); // should come from JWT, but for now param

  try {
    const result = await pool.query(
      `SELECT * FROM capacity_reports WHERE facility_id = $1 ORDER BY report_date DESC`,
      [hospitalId]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}