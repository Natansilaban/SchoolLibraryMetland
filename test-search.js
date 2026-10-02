require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { computeEmbedding } = require('./src/lib/search/embeddings');

// Simple similarity function for Float32Array
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function testJinaSearch() {
  console.log('🔍 MENGUJI JINA AI EMBEDDING (1024-DIMENSI) 🔍\n');
  
  // 1. Dapatkan Vektor Query dari Jina API
  const queryText = "Buku pelajaran anak sekolah tentang matematika";
  console.log(`1. Meminta vektor dari Jina API untuk query: "${queryText}"`);
  
  const queryVectorArray = await computeEmbedding(queryText, 'RETRIEVAL_QUERY');
  if (!queryVectorArray || queryVectorArray.length !== 1024) {
    console.error(`❌ GAGAL! Vektor yang dikembalikan tidak valid atau bukan 1024-dimensi.`);
    return;
  }
  const queryVector = new Float32Array(queryVectorArray);
  console.log(`✅ BERHASIL! Jina API merespons dengan vektor ${queryVector.length}-dimensi.\n`);

  // 2. Baca dari Database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`2. Mengambil kandidat buku dari Database...`);
  const books = await prisma.buku.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  
  if (books.length === 0) {
    console.log('Database kosong.');
    return;
  }

  let successRead = 0;
  for (const book of books) {
    if (book.embedding) {
      const vec = new Float32Array(book.embedding.buffer, book.embedding.byteOffset, book.embedding.byteLength / Float32Array.BYTES_PER_ELEMENT);
      if (vec.length === 1024) {
         const score = cosineSimilarity(queryVector, vec);
         console.log(`- [DATABASE HIT] "${book.judul}" -> Score: ${(score * 100).toFixed(2)}%`);
         successRead++;
      }
    } else {
      console.log(`- [MISSING DB VECTOR] "${book.judul}" (Belum di-migrasi)`);
    }
  }

  console.log(`\n📚 Berhasil membaca ${successRead} vektor Jina dari PostgreSQL (Bytes / Float32Array)!`);
  console.log(`💡 Skalabilitas terjamin! Tidak ada lagi loop ke Jina API untuk ribuan buku.`);
  process.exit(0);
}

testJinaSearch().catch(console.error);
