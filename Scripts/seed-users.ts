// scripts/seed-users.ts
import bcrypt from 'bcryptjs';
import pool from '../lib/db';

async function seedUsers() {
  const users = [
    { username: 'cmo', password: 'cmo@123', role: 'CMO', full_name: 'Dr. Sharma' },
    { username: 'deputy', password: 'deputy@123', role: 'Deputy-CMO', full_name: 'Dr. Gupta' },
    { username: 'nagar', password: 'nagar@123', role: 'Nagar-Swasthya', full_name: 'Mr. Patil' },
    { username: 'civil', password: 'hospital@123', role: 'Hospital-Admin', facility_id: 1, full_name: 'Civil Admin' },
    { username: 'asha01', password: 'asha@123', role: 'ASHA', ward_code: 'W01', full_name: 'Meena Jadhav' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role, ward_code, facility_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [u.username, hash, u.full_name, u.role, u.ward_code || null, u.facility_id || null]
    );
  }
  console.log('Users seeded');
  process.exit();
}
seedUsers().catch(console.error);