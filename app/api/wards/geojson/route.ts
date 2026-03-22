// app/api/wards/geojson/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

let cachedGeoJSON: any = null;

async function loadGeoJSON() {
  if (!cachedGeoJSON) {
    const filePath = path.join(process.cwd(), 'public', 'data', 'wards.geojson');
    const fileContent = await fs.readFile(filePath, 'utf8');
    cachedGeoJSON = JSON.parse(fileContent);
  }
  return cachedGeoJSON;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'disease';
    const days = parseInt(searchParams.get('days') || '7');

    // 1. Load static GeoJSON
    const geojsonData = await loadGeoJSON();

    // 2. Build SQL query based on view
    let metricSQL = '';
    if (view === 'disease') {
      metricSQL = `
        SELECT 
          ward_code,
          SUM(fever_count + cough_count + diarrhea_count) as metric
        FROM asha_reports
        WHERE report_date > CURRENT_DATE - $1::interval
        GROUP BY ward_code
      `;
    } else {
      // maternal view: count of reports with any maternal risk flag
      metricSQL = `
        SELECT 
          ward_code,
          COUNT(*) as metric
        FROM asha_reports
        WHERE report_date > CURRENT_DATE - $1::interval
          AND maternal_risk_flags IS NOT NULL
        GROUP BY ward_code
      `;
    }

    const metricResult = await pool.query(metricSQL, [`${days} days`]);

    // 3. Create a map of metrics
    const metricMap = new Map(
      metricResult.rows.map(row => [String(row.ward_code), parseInt(row.metric) || 0])
    );

    // 4. Enhance features with risk score
    const enhancedFeatures = geojsonData.features.map((feature: any) => {
      // pad with leading zero to match DB code (e.g. 1 -> W01, 12 -> W12)
      const wardIdStr = String(feature.properties.ward_no);
      const wardCode = `W${wardIdStr.padStart(2, '0')}`;
      
      const population = parseInt(feature.properties.tot_pop) || 10000; // fallback
      const metric = metricMap.get(wardCode) || 0;

      // Calculate risk score (incidence per 1000 population)
      const incidenceRate = (metric / population) * 1000;
      const riskScore = Math.min(Math.round(incidenceRate * 10), 100); // scale to 0-100

      return {
        ...feature,
        properties: {
          ...feature.properties,
          code: wardCode,
          name: feature.properties.ward_name || `Ward ${wardIdStr}`,
          total_pop: population,
          metric: metric,               // raw count
          riskScore: riskScore,          // 0-100
          lastReportDate: null,          // optional: can be added later
        },
      };
    });

    return NextResponse.json({
      type: 'FeatureCollection',
      features: enhancedFeatures,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('GeoJSON API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}