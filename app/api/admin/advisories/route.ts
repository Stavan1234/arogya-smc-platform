import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, description, severity, ward_code, expires_at, published_by } = await req.json();
    
    const result = await pool.query(
      `INSERT INTO public.advisories (title, description, severity, ward_code, published_at, expires_at, published_by) 
       VALUES ($1, $2, $3, $4, NOW(), $5, $6) RETURNING *`,
      [title, description, severity, ward_code, expires_at, published_by]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Advisory creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
