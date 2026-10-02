const { pipeline } = require('@xenova/transformers');
const { calculateSimilarity } = require('./src/lib/search/embeddings');

async function run() {
  const extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', { quantized: true });
  
  const query = "Cariin buku tentang koding";
  const doc1 = "Pemrograman Web Modern dengan JavaScript dan React. Panduan membangun aplikasi web interaktif...";
  const doc2 = "Bumi Manusia. Novel sejarah mahakarya sastra Indonesia yang mengisahkan pergulatan...";

  const outQ = await extractor(query, { pooling: 'mean', normalize: true });
  const outD1 = await extractor(doc1, { pooling: 'mean', normalize: true });
  const outD2 = await extractor(doc2, { pooling: 'mean', normalize: true });

  console.log('Q vs D1 (Koding):', calculateSimilarity(outQ.data, outD1.data));
  console.log('Q vs D2 (Sastra):', calculateSimilarity(outQ.data, outD2.data));
}

run();
