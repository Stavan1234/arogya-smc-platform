import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: replace with actual query from vaccinations table
  return NextResponse.json({
    coverage: 78,
    target: 100000,
    administered: 78000,
    trend: '+5%'
  });
}