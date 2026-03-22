import { NextRequest } from 'next/server';
import pool from './db';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function logAudit(
  request: NextRequest,
  action: string,
  tableName: string,
  recordId?: number,
  oldData?: any,
  newData?: any
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return;

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id;

    await pool.query(
      `INSERT INTO system_audit_logs (user_id, action_type, description, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, action, `${tableName} ${recordId} modified. Old: ${JSON.stringify(oldData)} New: ${JSON.stringify(newData)}`]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
}