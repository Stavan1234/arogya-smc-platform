const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'Stavan@1234',
  database: 'arogya_smc',
  host: 'localhost',
  port: 5432,
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT pg_get_functiondef(oid) 
      FROM pg_proc 
      WHERE proname = 'register_hospital';
    `);
    console.log("REGISTER HOSPITAL FUNCTION DEF:");
    console.log(res.rows[0]?.pg_get_functiondef);
    
    const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'v_hospital_dashboard';
    `);
    console.log("VIEW v_hospital_dashboard COLUMNS:");
    console.table(res2.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
