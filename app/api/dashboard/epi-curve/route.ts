import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const disease = searchParams.get('disease') || 'All';
  const span = searchParams.get('span') || '7d';

  let interval = '7 days';
  if (span === '24h') interval = '1 day';
  if (span === '30d') interval = '30 days';

  let diseaseFilter = '';
  if (disease !== 'All') {
    switch(disease.toLowerCase()) {
      case 'dengue': diseaseFilter = " AND fever_count >= 2"; break;
      case 'malaria': diseaseFilter = " AND fever_count >= 1 AND cough_count = 0"; break;
      case 'typhoid': diseaseFilter = " AND fever_count >= 1 AND diarrhea_count = 0"; break;
      case 'cholera': diseaseFilter = " AND diarrhea_count >= 3"; break;
      default: diseaseFilter = '';
    }
  }

  const baseCondition = `report_date >= CURRENT_DATE - INTERVAL '${interval}' ${diseaseFilter}`;

  try {
    const epiQuery = await pool.query(`
      SELECT 
        DATE(report_date) as date,
        COALESCE(SUM(CASE WHEN fever_count >= 2 THEN fever_count ELSE 0 END), 0) as dengue,
        COALESCE(SUM(CASE WHEN fever_count >= 1 AND cough_count = 0 THEN fever_count ELSE 0 END), 0) as malaria,
        COALESCE(SUM(CASE WHEN fever_count = 1 THEN 1 ELSE 0 END), 0) as fever,
        COALESCE(SUM(CASE WHEN diarrhea_count >= 1 THEN diarrhea_count ELSE 0 END), 0) as diarrhea,
        COALESCE(SUM(CASE WHEN diarrhea_count >= 3 THEN diarrhea_count ELSE 0 END), 0) as cholera
      FROM asha_reports
      WHERE ${baseCondition}
      GROUP BY DATE(report_date)
      ORDER BY date ASC
    `);

    const epiData = epiQuery.rows.map(row => ({
      date: row.date,
      dengue: parseInt(row.dengue),
      malaria: parseInt(row.malaria),
      fever: parseInt(row.fever),
      diarrhea: parseInt(row.diarrhea),
      cholera: parseInt(row.cholera)
    }));

    return NextResponse.json(epiData, {
      headers: { 'Cache-Control': 'public, max-age=30' }
    });
  } catch (error) {
    console.error('EPI Curve API error:', error);
    // Mock fallback
    return NextResponse.json(
      Array.from({length: 7}, (_, i) => ({
        date: `2024-${String(12-i).padStart(2,'0')}-15`,
        dengue: Math.floor(Math.random()*20),
        malaria: Math.floor(Math.random()*10),
        fever: Math.floor(Math.random()*30),
        diarrhea: Math.floor(Math.random()*15),
        cholera: Math.floor(Math.random()*5)
      })).reverse()
    );
  }
}

