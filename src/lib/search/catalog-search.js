import { prisma } from '@/lib/prisma';
import { computeEmbedding, computeBatchEmbeddings, calculateSimilarity } from '@/lib/search/embeddings';

/**
 * Normalizes and determines if a query is an exact bibliographic identifier (such as an ISBN).
 * @param {string} q
 * @returns {boolean}
 */
function isBibliographicCode(q) {
  const clean = q.replace(/[\s-]/g, '');
  return /^\d{9,13}[\dX]?$/i.test(clean);
}

/**
 * Deep Module: CatalogSearchService
 * Presents a small, simple interface to callers while encapsulating query intent classification,
 * vector embedding generation, cosine similarity calculation, and hybrid rank fusion.
 *
 * @param {Object} options
 * @param {string} [options.query] - Search keywords or natural language query
 * @param {number|string|null} [options.kategoriId] - Optional category filter
 * @param {number} [options.page=1] - 1-indexed page number
 * @param {number} [options.limit=20] - Number of items per page
 * @param {'auto'|'semantic'|'lexical'} [options.searchMode='auto']
 * @returns {Promise<{ data: Array, total: number, page: number, limit: number, mode: string, hasSemanticResults: boolean }>}
 */
export async function searchCatalog({
  query = '',
  kategoriId = null,
  page = 1,
  limit = 20,
  searchMode = 'auto',
} = {}) {
  const sanitizedQuery = (query || '').trim().slice(0, 100);
  const parsedKategoriId = kategoriId && !isNaN(parseInt(kategoriId, 10)) ? parseInt(kategoriId, 10) : null;
  const skip = (Math.max(1, page) - 1) * limit;

  // 1. Browse Mode: No search keyword supplied
  if (!sanitizedQuery) {
    const where = parsedKategoriId ? { kategoriId: parsedKategoriId } : {};
    const [data, total] = await Promise.all([
      prisma.buku.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          kategori: { select: { id: true, nama: true } },
          penulis: { select: { id: true, nama: true } },
          penerbit: { select: { id: true, nama: true } },
          _count: { select: { peminjaman: true } },
        },
      }),
      prisma.buku.count({ where }),
    ]);

    return {
      data,
      total,
      page: Math.max(1, page),
      limit,
      mode: 'browse',
      hasSemanticResults: false,
    };
  }

  // 2. Exact Match Mode: User input matches ISBN or barcode pattern
  if (isBibliographicCode(sanitizedQuery)) {
    const cleanIsbn = sanitizedQuery.replace(/[\s-]/g, '');
    const where = {
      AND: [
        {
          OR: [
            { isbn: { contains: sanitizedQuery, mode: 'insensitive' } },
            { isbn: { contains: cleanIsbn, mode: 'insensitive' } },
            { judul: { contains: sanitizedQuery, mode: 'insensitive' } },
          ],
        },
        parsedKategoriId ? { kategoriId: parsedKategoriId } : {},
      ],
    };

    const [data, total] = await Promise.all([
      prisma.buku.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          kategori: { select: { id: true, nama: true } },
          penulis: { select: { id: true, nama: true } },
          penerbit: { select: { id: true, nama: true } },
          _count: { select: { peminjaman: true } },
        },
      }),
      prisma.buku.count({ where }),
    ]);

    return {
      data,
      total,
      page: Math.max(1, page),
      limit,
      mode: 'exact',
      hasSemanticResults: false,
    };
  }

  // 3. Hybrid Semantic & Lexical Search
  if (searchMode !== 'lexical') {
    try {
      const queryVector = await computeEmbedding(sanitizedQuery);

      if (queryVector) {
        // Fetch candidate books (up to 200 items for responsive in-memory vector ranking)
        const candidates = await prisma.buku.findMany({
          where: parsedKategoriId ? { kategoriId: parsedKategoriId } : {},
          take: 200,
          include: {
            kategori: { select: { id: true, nama: true } },
            penulis: { select: { id: true, nama: true } },
            penerbit: { select: { id: true, nama: true } },
            _count: { select: { peminjaman: true } },
          },
        });

        if (candidates.length > 0) {
          const lowerQuery = sanitizedQuery.toLowerCase();
          const INDONESIAN_STOP_WORDS = new Set([
            'dan', 'atau', 'yang', 'di', 'ke', 'dari', 'pada', 'untuk', 'dengan', 'ini', 'itu',
            'adalah', 'dalam', 'bisa', 'akan', 'oleh', 'tentang', 'secara', 'karena', 'juga', 'ada',
            'buku', 'kitab', 'koleksi', 'semua', 'bacaan', 'daftar'
          ]);

          const queryTokens = lowerQuery
            .split(/[\s,.-]+/)
            .filter((w) => w.length >= 3 && !INDONESIAN_STOP_WORDS.has(w));

          // Clean, high-signal semantic text (excluding author to prevent topical dilution)
          const candidateTexts = candidates.map((book) =>
            [
              book.judul,
              book.kategori?.nama ? `Kategori: ${book.kategori.nama}` : '',
              book.deskripsi || '',
            ].filter(Boolean).join('. ')
          );

          const candidateVectors = await computeBatchEmbeddings(candidateTexts);
          const rawScoredBooks = [];

          for (let i = 0; i < candidates.length; i++) {
            const book = candidates[i];
            const bookVector = candidateVectors[i];
            const semanticScore = bookVector ? calculateSimilarity(queryVector, bookVector) : 0;

            const lowerTitle = book.judul.toLowerCase();
            const lowerDesc = (book.deskripsi || '').toLowerCase();
            const lowerAuthor = (book.penulis?.nama || '').toLowerCase();
            const lowerCategory = (book.kategori?.nama || '').toLowerCase();

            // Compute lexical match indicators
            const exactTitleMatch = lowerTitle.includes(lowerQuery);
            const exactDescMatch = lowerDesc.includes(lowerQuery);
            const authorMatch = lowerAuthor.includes(lowerQuery);

            const titleTokenHits = queryTokens.filter((tok) => lowerTitle.includes(tok)).length;
            const descTokenHits = queryTokens.filter((tok) => lowerDesc.includes(tok)).length;
            const categoryTokenHits = queryTokens.filter((tok) => lowerCategory.includes(tok)).length;

            const hasLexicalTitleOrAuthor = exactTitleMatch || authorMatch || titleTokenHits > 0;
            const hasCategoryHit = categoryTokenHits > 0;
            const isStrongSemantic = semanticScore >= 0.46;
            const hasCategoryWithSemantic = hasCategoryHit && semanticScore >= 0.28;
            const hasDescWithSemantic = (exactDescMatch || descTokenHits > 0) && semanticScore >= 0.32;

            // Strict admission gate: Reject any candidate that lacks lexical title/author match AND lacks strong semantic similarity
            if (hasLexicalTitleOrAuthor || isStrongSemantic || hasCategoryWithSemantic || hasDescWithSemantic) {
              let combinedScore = semanticScore;

              if (exactTitleMatch) combinedScore += 0.50;
              if (titleTokenHits > 0) combinedScore += Math.min(0.40, titleTokenHits * 0.20);
              if (authorMatch) combinedScore += 0.35;
              if (hasCategoryHit) combinedScore += 0.25;
              if (exactDescMatch) combinedScore += 0.20;
              if (descTokenHits > 0) combinedScore += Math.min(0.15, descTokenHits * 0.08);

              rawScoredBooks.push({
                ...book,
                _relevance: {
                  score: Math.round(combinedScore * 100) / 100,
                  semanticScore: Math.round(semanticScore * 100) / 100,
                  hasDirectMatch: hasLexicalTitleOrAuthor,
                  exactTitleMatch,
                  titleTokenHits,
                  authorMatch,
                },
              });
            }
          }

          if (rawScoredBooks.length > 0) {
            // Sort by combined relevance score descending
            rawScoredBooks.sort((a, b) => b._relevance.score - a._relevance.score);

            const maxScore = rawScoredBooks[0]._relevance.score;

            // Dynamic elbow cutoff: Discard background noise below 70% of top score
            const filteredBooks = rawScoredBooks.filter((item) => {
              if (item._relevance.hasDirectMatch) return true;
              return item._relevance.score >= Math.max(0.46, maxScore * 0.70);
            });

            // Mark genuine AI semantic discoveries (high confidence concept match without exact title match)
            const finalizedBooks = filteredBooks.map((item) => {
              const isDiscovery =
                item._relevance.semanticScore >= 0.48 &&
                !item._relevance.exactTitleMatch &&
                item._relevance.titleTokenHits === 0 &&
                !item._relevance.authorMatch &&
                item._relevance.score >= maxScore * 0.80;

              return {
                ...item,
                _relevance: {
                  ...item._relevance,
                  isSemanticMatch: isDiscovery,
                },
              };
            });

            if (finalizedBooks.length > 0) {
              const paginatedData = finalizedBooks.slice(skip, skip + limit);
              const hasSemanticDiscoveries = paginatedData.some((b) => b._relevance?.isSemanticMatch);

              return {
                data: paginatedData,
                total: finalizedBooks.length,
                page: Math.max(1, page),
                limit,
                mode: 'semantic',
                hasSemanticResults: hasSemanticDiscoveries,
              };
            }
          }
        }
      }
    } catch (err) {
      const isConnError = /connection|timeout|socket|econn/i.test(err.message || '');
      if (isConnError) {
        throw err;
      }
      console.warn('[SEARCH] Semantic search encountered non-fatal model error, falling back to lexical:', err.message || err);
    }
  }

  // 4. Lexical Fallback Search (PostgreSQL Substring Matching)
  const where = {
    AND: [
      {
        OR: [
          { judul: { contains: sanitizedQuery, mode: 'insensitive' } },
          { isbn: { contains: sanitizedQuery, mode: 'insensitive' } },
          { deskripsi: { contains: sanitizedQuery, mode: 'insensitive' } },
          { penulis: { nama: { contains: sanitizedQuery, mode: 'insensitive' } } },
          { kategori: { nama: { contains: sanitizedQuery, mode: 'insensitive' } } },
        ],
      },
      parsedKategoriId ? { kategoriId: parsedKategoriId } : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.buku.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        kategori: { select: { id: true, nama: true } },
        penulis: { select: { id: true, nama: true } },
        penerbit: { select: { id: true, nama: true } },
        _count: { select: { peminjaman: true } },
      },
    }),
    prisma.buku.count({ where }),
  ]);

  return {
    data,
    total,
    page: Math.max(1, page),
    limit,
    mode: 'lexical',
    hasSemanticResults: false,
  };
}
