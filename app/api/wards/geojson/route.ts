import { NextResponse } from 'next/server';
import pool from '@/lib/db';

interface WardRow {
  code: string;
  name: string;
  boundary_geojson: unknown;
}

export async function GET() {
  try {
    // In a real app, you'd store proper GeoJSON. For prototype, we generate simplified polygons.
    const wards = await pool.query('SELECT code, name, boundary_geojson FROM wards');
    const features = wards.rows.map((ward: WardRow) => ({
      type: 'Feature',
      properties: {
        code: ward.code,
        name: ward.name,
        // we could add risk score here later
      },
      geometry: ward.boundary_geojson || {
        type: 'Polygon',
        coordinates: [[
          [75.9 + (parseInt(ward.code.slice(1)) * 0.01), 17.68],
          [75.92 + (parseInt(ward.code.slice(1)) * 0.01), 17.68],
          [75.92 + (parseInt(ward.code.slice(1)) * 0.01), 17.69],
          [75.9 + (parseInt(ward.code.slice(1)) * 0.01), 17.69],
          [75.9 + (parseInt(ward.code.slice(1)) * 0.01), 17.68]
        ]]
      }
    }));

    return NextResponse.json({
      type: 'FeatureCollection',
      features
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}