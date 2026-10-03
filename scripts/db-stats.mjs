import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://casaos:casaos@100.92.251.18:5432/metschoo',
  connectionTimeoutMillis: 15000,
});

const stats = await pool.query(`
  SELECT
    (SELECT COUNT(*) FROM buku)     AS total_buku,
    (SELECT COUNT(*) FROM kategori) AS total_kategori,
    (SELECT COUNT(*) FROM penulis)  AS total_penulis,
    (SELECT COUNT(*) FROM penerbit) AS total_penerbit
`);
console.log('Stats:', stats.rows[0]);

const kat = await pool.query('SELECT id, nama FROM kategori ORDER BY id');
console.log('\nKategori:');
kat.rows.forEach(r => console.log(`  ${r.id}: ${r.nama}`));

const penSample = await pool.query('SELECT id, nama FROM penulis ORDER BY id LIMIT 5');
console.log('\nSample Penulis:', penSample.rows);

const pnrSample = await pool.query('SELECT id, nama FROM penerbit ORDER BY id LIMIT 5');
console.log('\nSample Penerbit:', pnrSample.rows);

await pool.end();
