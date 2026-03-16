import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id, title, description, severity, ward_code, 
             to_char(published_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as published_at,
             expires_at
      FROM advisories
      WHERE (expires_at IS NULL OR expires_at > NOW())
      ORDER BY published_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}