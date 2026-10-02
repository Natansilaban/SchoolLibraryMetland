const { computeEmbedding, calculateSimilarity } = require('../src/lib/search/embeddings');

const books = [
  { judul: 'Teknik Dasar Pastry & Bakery Profesional', kategori: 'Kuliner & Tata Boga', penulis: 'Bambang Hermanto' },
  { judul: 'Ayat-Ayat Cinta', kategori: 'Teknologi', penulis: 'Dewi Lestari' },
  { judul: 'Fisika Modern', kategori: 'Bahasa', penulis: 'Andrea Hirata' },
  { judul: 'Matematika Dasar SMA', kategori: 'Non-Fiksi', penulis: 'Pramoedya Ananta Toer' },
  { judul: 'Buku gwah', kategori: 'Matematika', penulis: 'Andrea Hirata' },
  { judul: 'Sejarah Indonesia Lengkap', kategori: 'Sejarah', penulis: 'Dewi Lestari' },
  { judul: 'Negeri 5 Menara', kategori: 'Seni & Budaya', penulis: 'Habiburrahman El Shirazy' },
  { judul: 'Bumi Manusia', kategori: 'Sastra & Fiksi', penulis: 'Pramoedya Ananta Toer' }
];

async function simulate(query) {
  console.log('\n=========================================');
  console.log('QUERY:', query);
  console.log('=========================================');
  const lowerQuery = query.toLowerCase().trim();
  const qVec = await computeEmbedding(query);
  const STOP_WORDS = new Set(['buku', 'dan', 'atau', 'yang', 'di', 'ke', 'dari', 'koleksi']);
  const tokens = lowerQuery.split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w));

  const scored = [];
  for (const b of books) {
    // Focused semantic text: Title, Category, and Description (excluding author name to avoid topical dilution)
    const semanticText = [b.judul, b.kategori, b.deskripsi || ''].filter(Boolean).join('. ');
    const bVec = await computeEmbedding(semanticText);
    const sem = calculateSimilarity(qVec, bVec);

    const lowerTitle = b.judul.toLowerCase();
    const lowerCat = b.kategori.toLowerCase();
    const lowerAuthor = b.penulis.toLowerCase();

    const exactTitle = lowerTitle.includes(lowerQuery);
    const authorHit = lowerAuthor.includes(lowerQuery);
    const titleTokenHits = tokens.filter(t => lowerTitle.includes(t)).length;
    const catHits = tokens.filter(t => lowerCat.includes(t)).length;

    const hasLexicalTitleOrAuthor = exactTitle || authorHit || titleTokenHits > 0;
    const hasCategoryHit = catHits > 0;
    const isStrongSemantic = sem >= 0.46;

    // Strict admission gate:
    // 1. Keyword match in title or author
    // 2. High semantic similarity (>= 0.46)
    // 3. Category match with at least mild semantic support (>= 0.28)
    if (hasLexicalTitleOrAuthor || isStrongSemantic || (hasCategoryHit && sem >= 0.28)) {
      let score = sem;
      if (exactTitle) score += 0.50;
      if (titleTokenHits > 0) score += titleTokenHits * 0.25;
      if (authorHit) score += 0.35;
      if (hasCategoryHit) score += 0.25;

      scored.push({
        judul: b.judul,
        sem: sem.toFixed(3),
        score: score.toFixed(3),
        exactTitle,
        authorHit,
        titleTokenHits,
        hasCategoryHit
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  if (scored.length === 0) {
    console.log('HASIL: 0 BUKU DITEMUKAN (Akurat! Tidak ada buku yang dipaksakan)');
    return;
  }

  const maxScore = parseFloat(scored[0].score);
  const filtered = scored.filter(item => {
    if (item.exactTitle || item.titleTokenHits > 0) return true;
    return parseFloat(item.score) >= Math.max(0.50, maxScore * 0.70);
  });

  if (filtered.length === 0) {
    console.log('HASIL: 0 BUKU DITEMUKAN (Semua kandidat di bawah margin cutoff)');
    return;
  }

  filtered.forEach(item => {
    const isSemanticDiscovery = parseFloat(item.sem) >= 0.52 && !item.exactTitle && item.titleTokenHits === 0;
    console.log(`- [Total: ${item.score} | Sem: ${item.sem}] "${item.judul}" ${isSemanticDiscovery ? '-> [Topik Relevan]' : ''}`);
  });
}

async function run() {
  await simulate('pastry');
  await simulate('masak');
  await simulate('resep kue');
  await simulate('aljabar');
  await simulate('sejarah perang');
  await simulate('sastra');
  await simulate('astronomi');
}
run();
