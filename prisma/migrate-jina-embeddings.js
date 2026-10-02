require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { computeBatchEmbeddings } = require('../src/lib/search/embeddings');

// Custom pool with generous timeouts for heavy migration scripts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  statement_timeout: 120000, // 2 minutes
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log('Starting Jina AI Vector Migration...');
  
  // 1. Fetch all books
  const books = await prisma.buku.findMany();
  console.log(`Found ${books.length} books in the database.`);

  if (books.length === 0) {
    console.log('No books to migrate.');
    process.exit(0);
  }

  // 2. Prepare the texts for embedding
  const texts = books.map(book => {
    const author = book.penulis?.nama ?? '';
    const category = book.kategori?.nama ?? '';
    const desc = book.deskripsi ?? '';
    return `${book.judul} ${author} ${category} ${desc}`.trim().slice(0, 512);
  });

  // 3. Batch generate new embeddings (using Jina AI)
  console.log('Generating new 1024-dimensional embeddings via Jina...');
  let newVectors;
  try {
    newVectors = await computeBatchEmbeddings(texts, 'RETRIEVAL_DOCUMENT');
  } catch (err) {
    console.error('FAILED to generate embeddings:', err.message);
    console.log('Hint: Ensure your Jina API at jina.r1fikri.dev is running with the `--embeddings` flag enabled!');
    process.exit(1);
  }

  // 4. Update the database
  let successCount = 0;
  for (let i = 0; i < books.length; i++) {
    const vector = newVectors[i];
    if (vector && vector.length === 1024) {
      // Encode as Buffer (Prisma Bytes mapping for Float32Array)
      const f32 = new Float32Array(vector);
      const buffer = Buffer.from(f32.buffer);
      await prisma.buku.update({
        where: { id: books[i].id },
        data: { embedding: buffer }
      });
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
