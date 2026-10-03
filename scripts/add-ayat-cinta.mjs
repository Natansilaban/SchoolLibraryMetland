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

const DB_URL    = process.env.DATABASE_URL;
const JINA_URL  = process.env.JINA_API_URL;
const JINA_KEY  = process.env.JINA_API_KEY  || '';
const CF_ID     = process.env.CF_ACCESS_CLIENT_ID     || '';
const CF_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || '';

const NEW_PENULIS = ['Habiburrahman El Shirazy'];

const NEW_BOOKS = [
  { judul: 'Ayat-Ayat Cinta', kat: 13, penulis: 'Habiburrahman El Shirazy', penerbit: 'Republika Penerbit', tahun: 2004, stok: 6, deskripsi: 'Novel pembangun jiwa yang mengisahkan cinta sejati berlandaskan agama Islam dengan latar di Mesir.' }
];

async function main() {
  const db = new Client({ connectionString: DB_URL });
  await db.connect();
  console.log('Connected to DB');

  for (const nama of NEW_PENULIS) {
    await db.query('INSERT INTO penulis (nama, created_at, updated_at) VALUES ($1, NOW(), NOW()) ON CONFLICT DO NOTHING', [nama]);
  }

  const penulisRes = await db.query('SELECT id, nama FROM penulis');
  const penulisMap = {};
  for (const r of penulisRes.rows) penulisMap[r.nama] = r.id;

  const penerbitRes = await db.query('SELECT id, nama FROM penerbit');
  const penerbitMap = {};
  for (const r of penerbitRes.rows) penerbitMap[r.nama] = r.id;

  for (const b of NEW_BOOKS) {
    const textToEmbed = `${b.judul} ${b.deskripsi}`;
    let embedding = null;
    try {
      const resp = await fetch(JINA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JINA_KEY}`,
          'CF-Access-Client-Id': CF_ID,
          'CF-Access-Client-Secret': CF_SECRET
        },
        body: JSON.stringify({
          model: 'jina-embeddings-v3',
          task: 'retrieval.passage',
          dimensions: 1024,
          late_chunking: false,
          embedding_type: 'float',
          input: [textToEmbed]
        })
      });
      const data = await resp.json();
      embedding = data.data?.[0]?.embedding;
    } catch (e) {
      console.log('Error embedding:', e);
    }
    
    let vecStr = '';
    if (embedding) {
      vecStr = JSON.stringify(embedding);
    }

    const pid = penulisMap[b.penulis];
    const pnrId = penerbitMap[b.penerbit];

    await db.query(`
      INSERT INTO buku (judul, kategori_id, penulis_id, penerbit_id, tahun_terbit, stok, deskripsi, embedding, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, ${vecStr ? '$8::vector' : 'NULL'}, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, vecStr ? [b.judul, b.kat, pid, pnrId, b.tahun, b.stok, b.deskripsi, vecStr] : [b.judul, b.kat, pid, pnrId, b.tahun, b.stok, b.deskripsi]);
    
    console.log(`Inserted ${b.judul}`);
  }

  await db.end();
}

main();
