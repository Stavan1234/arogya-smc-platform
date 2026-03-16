// lib/db.js
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',          // your PostgreSQL username
  host: 'localhost',
  database: 'arogya_smc',    // database name
  password: 'Stavan@1234', // replace with your actual password
  port: 5432,
});

export default pool;