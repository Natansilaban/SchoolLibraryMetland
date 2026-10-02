const { computeEmbedding, computeBatchEmbeddings, calculateSimilarity } = require('./src/lib/search/embeddings');
const { prisma } = require('./src/lib/prisma');

async function testSim() {
  const query = "Cariin buku tentang koding";
  const queryVector = await computeEmbedding(query);
  if (!queryVector) {
    console.log("Failed to compute query vector");
    return;
  }
  
  const books = await prisma.buku.findMany({ take: 5 });
  for (const b of books) {
    const text = [b.judul, b.deskripsi].join(' ');
    const [bVec] = await computeBatchEmbeddings([text]);
    const sim = calculateSimilarity(queryVector, bVec);
    console.log(`Sim: ${sim.toFixed(3)} | Title: ${b.judul}`);
  }
}

testSim();
