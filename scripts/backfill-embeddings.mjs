/**
 * Backfill Embeddings Script
 * Menggunakan pg client langsung — tidak ada Prisma adapter layer.
 *
 * Usage:
 *   node scripts/backfill-embeddings.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';

// ── Load .env ─────────────────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env');
try {
  for (const line of readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
  console.log('✓ Loaded .env');
} catch { console.warn('⚠  Could not load .env'); }

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const JINA_URL  = process.env.JINA_API_URL;
const JINA_KEY  = process.env.JINA_API_KEY  || '';
const CF_ID     = process.env.CF_ACCESS_CLIENT_ID     || '';
const CF_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || '';
const DB_URL    = process.env.DATABASE_URL;

const BATCH = 20;
const DELAY = 300;

if (!JINA_URL) { console.error('❌  JINA_API_URL not set'); process.exit(1); }
if (!DB_URL)   { console.error('❌  DATABASE_URL not set'); process.exit(1); }

// ── DB Client (raw pg, no Prisma adapter layer) ───────────────────────────────
const db = new Client({
  connectionString: DB_URL,
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
  statement_timeout: 30000,
});

// ── Build embed text (same format as app) ────────────────────────────────────
function buildText(row) {
  return [
    row.judul,
    row.penulis_nama  ? 'Penulis: '  + row.penulis_nama  : '',
    row.kategori_nama ? 'Kategori: ' + row.kategori_nama : '',
    row.deskripsi ?? '',
  ].filter(Boolean).join('. ').slice(0, 512);
}

// ── Jina batch API ────────────────────────────────────────────────────────────
async function embedBatch(texts) {
  const h = { 'Content-Type': 'application/json' };
  if (JINA_KEY)             h['Authorization']          = 'Bearer ' + JINA_KEY;
  if (CF_ID && CF_SECRET) { h['CF-Access-Client-Id']     = CF_ID;
                             h['CF-Access-Client-Secret'] = CF_SECRET; }
  const r = await fetch(JINA_URL, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      model: 'jina-embeddings-v5-text-small',
      task:  'retrieval.passage',
      input: texts,
    }),
  });
  if (!r.ok) throw new Error(`Jina HTTP ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
  const j = await r.json();
  return (j?.data ?? []).map(d => d?.embedding ?? null);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Connecting to database...');
  await db.connect();
  console.log('✓ Connected\n');

  // Count books without embedding
  const { rows: [{ count }] } = await db.query(
    'SELECT COUNT(*)::int AS count FROM buku WHERE embedding IS NULL'
  );
  console.log(`Books needing embedding: ${count}`);
  if (Number(count) === 0) {
    console.log('Nothing to do — all books already have embeddings!');
    await db.end();
    return;
  }

  // Fetch all books without embedding using a JOIN for penulis/kategori names
  const { rows: books } = await db.query(`
    SELECT
      b.id,
      b.judul,
      b.deskripsi,
      p.nama AS penulis_nama,
      k.nama AS kategori_nama
    FROM buku b
    LEFT JOIN penulis p  ON b.penulis_id  = p.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE b.embedding IS NULL
    ORDER BY b.id ASC
  `);

  let ok = 0, fail = 0;
  const totalBatches = Math.ceil(books.length / BATCH);

  for (let i = 0; i < books.length; i += BATCH) {
    const batch = books.slice(i, i + BATCH);
    const n     = Math.floor(i / BATCH) + 1;
    process.stdout.write(`  Batch ${String(n).padStart(3)}/${totalBatches} [${i + 1}–${Math.min(i + BATCH, books.length)}]  `);

    try {
      const vecs = await embedBatch(batch.map(buildText));

      for (let j = 0; j < batch.length; j++) {
        const vec = vecs[j];
        if (!Array.isArray(vec) || vec.length === 0) { fail++; continue; }
        const vecStr = '[' + vec.join(',') + ']';
        await db.query(
          'UPDATE buku SET embedding = $1::vector WHERE id = $2',
          [vecStr, batch[j].id]
        );
        ok++;
      }
      console.log('OK');
    } catch (e) {
      console.log('FAILED — ' + e.message);
      fail += batch.length;
    }

    if (i + BATCH < books.length) {
      await new Promise(r => setTimeout(r, DELAY));
    }
  }

  console.log('');
  console.log('='.repeat(50));
  console.log(`  Done.  Success: ${ok}  |  Failed: ${fail}`);
  console.log('='.repeat(50));
  if (fail > 0) console.log('  Re-run to retry failed books (idempotent).');
  else          console.log('  All books are now vector-searchable!');

  await db.end();
}

main().catch(async e => {
  console.error('Fatal:', e.message || e);
  await db.end().catch(() => {});
  process.exit(1);
});
