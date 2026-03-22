import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  try {
    const configs = await req.json(); // Expecting key-value object
    
    // Begin transaction for bulk upsert
    await pool.query('BEGIN');
    for (const [key, value] of Object.entries(configs)) {
      await pool.query(
        `INSERT INTO public.rti_config (key, value) VALUES ($1, $2) 
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
      );
    }
    await pool.query('COMMIT');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Config update failed:', error);
    await pool.query('ROLLBACK');
    return NextResponse.json({ error: 'Config update failed' }, { status: 500 });
  }
}
