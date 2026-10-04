require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { computeBatchEmbeddings } = require('../src/lib/search/embeddings');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  statement_timeout: 120000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log('Starting Jina AI Vector Migration...');
  const books = await prisma.buku.findMany();
  console.log(`Found ${books.length} books in the database.`);

  if (books.length === 0) {
    console.log('No books to migrate.');
    process.exit(0);
  }
  const texts = books.map(book => {
    const author = book.penulis?.nama ?? '';
    const category = book.kategori?.nama ?? '';
    const desc = book.deskripsi ?? '';
    return `${book.judul} ${author} ${category} ${desc}`.trim().slice(0, 512);
  });
  console.log('Generating new 1024-dimensional embeddings via Jina...');
  let newVectors;
  try {
    newVectors = await computeBatchEmbeddings(texts, 'RETRIEVAL_DOCUMENT');
  } catch (err) {
    console.error('FAILED to generate embeddings:', err.message);
    console.log('Hint: Ensure your Jina API at ' + (process.env.JINA_API_URL || 'JINA_API_URL') + ' is reachable and running!');
    process.exit(1);
  }
  let successCount = 0;
  for (let i = 0; i < books.length; i++) {
    const vector = newVectors[i];
    if (vector && vector.length === 1024) {
      const f32 = new Float32Array(vector);
      const vectorStr = `[${f32.join(',')}]`;
      await prisma.$executeRaw`
        UPDATE buku 
        SET embedding = ${vectorStr}::vector 
        WHERE id = ${books[i].id}
      `;
      successCount++;
    }
  }

  console.log(`Migration complete! Successfully updated ${successCount}/${books.length} books with Jina vectors.`);
  process.exit(0);
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
