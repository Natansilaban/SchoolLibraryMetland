import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/school_library' // fallback or read from env
});

async function run() {
  try {
    const { rows } = await pool.query("SELECT id FROM \"anggota\" WHERE \"user_id\" IN (SELECT id FROM \"users\" WHERE role='SISWA' ORDER BY id ASC LIMIT 1)");
    if(rows.length > 0) {
      const anggotaId = rows[0].id;
      const res = await pool.query("DELETE FROM \"peminjaman\" WHERE \"anggota_id\" = $1", [anggotaId]);
      console.log(`Deleted ${res.rowCount} peminjaman for demo user.`);
    } else {
      console.log("No demo user found.");
    }
  } catch(e) {
    console.error("DB Error:", e);
  } finally {
    pool.end();
  }
}

run();
