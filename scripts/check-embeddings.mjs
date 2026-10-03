import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';

for (const line of readFileSync(resolve(process.cwd(), '.env'), 'utf-8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq < 1) continue;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const require = createRequire(import.meta.url);
const { Client } = require('pg');

async function check() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();
  const res = await c.query('SELECT COUNT(*) AS total, SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) AS vectorized, SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) AS missing FROM buku');
  console.log(res.rows[0]);
  
  const nullRes = await c.query('SELECT judul FROM buku WHERE embedding IS NULL');
  if (nullRes.rows.length > 0) {
    console.log('Books without embeddings:');
    for (const r of nullRes.rows) console.log('- ' + r.judul);
  }
  await c.end();
}
check();
