// app/api/audit/log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const { action, tableName, recordId, oldData, newData } = await request.json();
    await logAudit(request, action, tableName, recordId, oldData, newData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Audit log error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}