import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      facility_name, ward_code, location_lat, location_lng, 
      contact, facility_type, address, specialties, 
      username, password, full_name 
    } = body;

    if (!facility_name || !ward_code || !contact || !username || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Ensure specialties is valid JSON string for parameter
    const specialtiesJson = JSON.stringify(specialties || ['General Medicine']);

    // Call the database function
    const result = await pool.query(
      `SELECT * FROM public.register_hospital($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)`,
      [
        facility_name,
        ward_code,
        location_lat,
        location_lng,
        contact,
        facility_type,
        address,
        specialtiesJson,
        username,
        password_hash,
        full_name
      ]
    );

    const { success, message, facility_id, user_id } = result.rows[0];

    if (!success) {
      // Check if it's a unique constraint violation (username exists)
      if (message.includes('unique constraint')) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message,
      facility_id,
      user_id
    });
    
  } catch (error: any) {
    console.error('Hospital registration error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
