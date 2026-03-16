import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, acknowledged_at, resolved_at } = await request.json();
    const result = await pool.query(
      `UPDATE alerts SET status = $1, acknowledged_at = $2, resolved_at = $3 WHERE id = $4 RETURNING *`,
      [status, acknowledged_at, resolved_at, id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
