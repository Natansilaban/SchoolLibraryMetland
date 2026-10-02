/**
 * CatalogSearchService
 *
 * A production-grade hybrid search engine:
 *   1. ISBN/barcode exact match
 *   2. AI semantic vector search (Gemini or local ONNX via @huggingface/transformers)
 *   3. Intelligent lexical fallback with Indonesian stopword filtering
 *
 * Query intelligence pipeline:
 *   a. Intent detection  — are we looking for a title, author, topic, or ISBN?
 *   b. Stopword stripping — remove conversational filler before embedding
 *   c. Alias expansion   — map common informal terms to canonical library terms
 *   d. Hybrid scoring    — semantic score + lexical boosters, hard-gated by vector dimensionality
 */

import { prisma } from '@/lib/prisma';
import {
  computeEmbedding,
  computeBatchEmbeddings,
  calculateSimilarity,
} from '@/lib/search/embeddings';

// ---------------------------------------------------------------------------
// Indonesian stopwords and conversational filler for this domain
// ---------------------------------------------------------------------------
const STOP_WORDS = new Set([
  'cariin', 'cari', 'cariakan', 'carikan', 'kasih', 'tolong', 'dong', 'deh', 'nih',
  'buku', 'judul', 'novel', 'kategori', 'koleksi', 'perpustakaan',
  'tentang', 'mengenai', 'berkaitan', 'berhubungan', 'soal', 'hal',
  'yang', 'ada', 'di', 'dan', 'atau', 'dengan', 'untuk', 'buat',
  'dari', 'ke', 'ini', 'itu', 'juga', 'lebih', 'paling', 'sangat',
  'gak', 'enggak', 'tidak', 'gw', 'aku', 'saya', 'mau', 'pengen',
  'ingin', 'minta', 'info', 'ada', 'apa', 'itu',
]);

// Lexical stop words — only pure conversational filler.
// Deliberately keeps content words ('novel', 'fisika', 'kopi') so that
// lexical keyword search doesn't silently drop what the user is asking for.
// Includes prepositions/topic words ('tentang', 'mengenai') that appear in virtually
// every book description and would otherwise match hundreds of unrelated books.
const LEXICAL_STOP_WORDS = new Set([
  'cariin', 'cari', 'cariakan', 'carikan', 'kasih', 'tolong', 'dong', 'deh', 'nih',
  'buku', 'tentang', 'mengenai', 'soal', 'hal', 'berkaitan', 'berhubungan', 'bikin', 'cara',
  'yang', 'ada', 'di', 'dan', 'atau', 'dengan', 'untuk', 'buat',
  'dari', 'ke', 'ini', 'itu', 'juga', 'lebih', 'paling', 'sangat',
  'gak', 'enggak', 'tidak', 'gw', 'aku', 'saya', 'mau', 'pengen',
  'ingin', 'minta', 'info', 'apa',
]);

// Alias map: informal query terms -> canonical library/topic terms for better embedding signal
const ALIAS_MAP = {
  'koding': 'pemrograman komputer',
  'coding': 'pemrograman komputer',
  'ngoding': 'pemrograman komputer',
  'programing': 'pemrograman',
  'masak': 'kuliner memasak',
  'makanan': 'kuliner pangan tata boga',
  'hotel': 'perhotelan hospitality',
  'wisata': 'pariwisata',
  'bisnis': 'kewirausahaan bisnis',
  'dagang': 'kewirausahaan perdagangan',
  'sastra': 'sastra fiksi novel',
  'novel': 'sastra fiksi novel',
  'cerpen': 'sastra fiksi cerita pendek',
  'fisika': 'fisika sains alam',
  'kimia': 'kimia sains',
  'biologi': 'biologi sains alam',
  'matematika': 'matematika logika',
  'sejarah': 'sejarah sosial budaya',
  'bahasa': 'bahasa komunikasi',
  'inggris': 'bahasa inggris komunikasi',
  'web': 'pengembangan web pemrograman',
  'python': 'pemrograman python',
  'javascript': 'pemrograman javascript web',
  'jaringan': 'jaringan komputer teknologi',
  'ai': 'kecerdasan buatan machine learning',
  'ml': 'machine learning kecerdasan buatan',
  'database': 'basis data pemrograman',
};

// ---------------------------------------------------------------------------
// Query normalization utilities
// ---------------------------------------------------------------------------

/**
 * Detects rough search intent from the raw query.
 * @param {string} raw
 * @returns {'isbn'|'author'|'topic'|'title'}
 */
function detectIntent(raw) {
  const lower = raw.toLowerCase();
  // ISBN patterns
  if (/^\d[\d\s-]{8,16}[\dxX]$/.test(raw.replace(/\s/g, ''))) return 'isbn';
  // Author cues
  if (/\b(karya|oleh|penulis|pengarang|author)\b/.test(lower)) return 'author';
  // Topic / semantic query (most common for conversational search)
  if (/\b(tentang|mengenai|soal|topik|tema|berhubungan|berkaitan|membahas)\b/.test(lower)) return 'topic';
  return 'title'; // default
}

/**
 * Strips stop words, expands aliases, and returns a clean semantic query string.
 * @param {string} raw
 * @returns {string}
 */
function buildSemanticQuery(raw) {
  const tokens = raw
    .toLowerCase()
    .split(/[\s,.\-!?;:]+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  // Expand aliases — replace token with expanded phrase if found
  const expanded = tokens.flatMap((t) => (ALIAS_MAP[t] ? ALIAS_MAP[t].split(' ') : [t]));

  // De-duplicate while preserving order
  const seen = new Set();
  const deduped = expanded.filter((w) => (seen.has(w) ? false : seen.add(w)));

  // Always return something — fall back to original if stripping removed everything
  return deduped.join(' ') || raw;
}

/**
 * Extract meaningful lexical keywords for scoring boosts (separate from semantic query).
 * Uses LEXICAL_STOP_WORDS (conservative) so content words like 'novel' are not dropped.
 * @param {string} raw
 * @param {Set<string>} [stopWords]
 * @returns {string[]}
 */
function extractKeywords(raw, stopWords = LEXICAL_STOP_WORDS) {
  return raw
    .toLowerCase()
    .split(/[\s,.\-!?;:]+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w));
}

// ---------------------------------------------------------------------------
// ISBN / bibliographic code check
// ---------------------------------------------------------------------------
function isBibliographicCode(q) {
  return /^\d{9,13}[\dxX]?$/.test(q.replace(/[\s-]/g, ''));
}

// ---------------------------------------------------------------------------
// Book text for embedding (title + category + synopsis)
// ---------------------------------------------------------------------------
function bookEmbedText(book) {
  return [
    book.judul,
    book.kategori?.nama ? `Kategori: ${book.kategori.nama}` : '',
    book.deskripsi ?? '',
  ]
    .filter(Boolean)
    .join('. ');
}

// ---------------------------------------------------------------------------
// Prisma include block (reused in all queries)
// ---------------------------------------------------------------------------
const BOOK_INCLUDE = {
  kategori: { select: { id: true, nama: true } },
  penulis: { select: { id: true, nama: true } },
  penerbit: { select: { id: true, nama: true } },
  _count: { select: { peminjaman: true } },
};

// ---------------------------------------------------------------------------
// Main search function
// ---------------------------------------------------------------------------

/**
 * Hybrid semantic + lexical catalog search.
 *
 * @param {Object} options
 * @param {string} [options.query]
 * @param {number|string|null} [options.kategoriId]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {'auto'|'semantic'|'lexical'} [options.searchMode='auto']
 * @returns {Promise<{ data: any[], total: number, page: number, limit: number, mode: string, hasSemanticResults: boolean }>}
 */
export async function searchCatalog({
  query = '',
  kategoriId = null,
  page = 1,
  limit = 20,
  searchMode = 'auto',
} = {}) {
  const raw = (query ?? '').trim().slice(0, 300);
  const parsedKategoriId =
    kategoriId && !isNaN(parseInt(kategoriId, 10)) ? parseInt(kategoriId, 10) : null;
  const skip = (Math.max(1, page) - 1) * limit;
  const categoryWhere = parsedKategoriId ? { kategoriId: parsedKategoriId } : {};

  // ------------------------------------------------------------------ //
  // 1. Browse mode — no query
  // ------------------------------------------------------------------ //
  if (!raw) {
    const [data, total] = await Promise.all([
      prisma.buku.findMany({
        where: categoryWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: BOOK_INCLUDE,
      }),
      prisma.buku.count({ where: categoryWhere }),
    ]);
    return { data, total, page: Math.max(1, page), limit, mode: 'browse', hasSemanticResults: false };
  }

  // ------------------------------------------------------------------ //
  // 2. ISBN exact match
  // ------------------------------------------------------------------ //
  if (isBibliographicCode(raw)) {
    const clean = raw.replace(/[\s-]/g, '');
    const where = {
      AND: [
        { OR: [{ isbn: { contains: clean, mode: 'insensitive' } }, { judul: { contains: raw, mode: 'insensitive' } }] },
        categoryWhere,
      ],
    };
    const [data, total] = await Promise.all([
      prisma.buku.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: BOOK_INCLUDE }),
      prisma.buku.count({ where }),
    ]);
    return { data, total, page: Math.max(1, page), limit, mode: 'exact', hasSemanticResults: false };
  }

  // ------------------------------------------------------------------ //
  // 3. Semantic search
  // ------------------------------------------------------------------ //
  if (searchMode !== 'lexical') {
    try {
      const intent = detectIntent(raw);
      const semanticQuery = buildSemanticQuery(raw);
      const keywords = extractKeywords(raw);
      const lowerRaw = raw.toLowerCase();

      const queryVector = await computeEmbedding(semanticQuery, 'RETRIEVAL_QUERY');

      if (queryVector) {
        // Fetch all candidates (bounded at 500 to avoid OOM on large libraries)
        const candidates = await prisma.buku.findMany({
          where: categoryWhere,
          take: 500,
          include: BOOK_INCLUDE,
        });

        if (candidates.length > 0) {
          const candidateData = [];
          const missingEmbeddings = [];

          for (const book of candidates) {
            let vec = null;
            if (book.embedding) {
               vec = new Float32Array(book.embedding.buffer, book.embedding.byteOffset, book.embedding.byteLength / Float32Array.BYTES_PER_ELEMENT);
               if (vec.length !== queryVector.length) vec = null; // dimension mismatch
            }
            
            if (!vec) {
               missingEmbeddings.push(book);
            } else {
               candidateData.push({ book, vec, semScore: calculateSimilarity(queryVector, vec) });
            }
          }
          
          if (missingEmbeddings.length > 0) {
            const candidateTexts = missingEmbeddings.map(bookEmbedText);
            const computedVectors = await computeBatchEmbeddings(candidateTexts, 'RETRIEVAL_DOCUMENT');
            
            for (let i = 0; i < missingEmbeddings.length; i++) {
              const book = missingEmbeddings[i];
              const vec = computedVectors[i];
              const isValid = vec && vec.length === queryVector.length;
              const semScore = isValid ? calculateSimilarity(queryVector, vec) : 0;
              candidateData.push({ book, vec, semScore });
            }
          }

          let maxSemScore = 0;
          for (const item of candidateData) {
            if (item.semScore > maxSemScore) maxSemScore = item.semScore;
          }

          // Adaptive Thresholding based on best practices:
          // We use a relative drop-off (elbow) approach on top of absolute floors.
          const isJina = queryVector.length === 1024;
          
          // Jina Baseline: Relevant matches hover around 0.30 - 0.40 in this dataset
          // ONNX Baseline: Usually similar ranges
          const semFloor = isJina ? 0.20 : 0.20;
          
          // Relative margin: we accept documents that score within this margin of the top match
          const adaptiveMargin = isJina ? 0.15 : 0.12;
          const semThreshold = Math.max(semFloor, maxSemScore - adaptiveMargin);

          const scored = [];
          for (const { book, vec, semScore } of candidateData) {
            if (!vec || vec.length !== queryVector.length) continue;

            const lowerTitle = book.judul.toLowerCase();
            const lowerDesc = (book.deskripsi ?? '').toLowerCase();
            const lowerAuthor = (book.penulis?.nama ?? '').toLowerCase();
            const lowerCategory = (book.kategori?.nama ?? '').toLowerCase();

            // Lexical scoring boosters (additive on top of semantic)
            const exactTitle = lowerTitle.includes(lowerRaw);
            const titleHits = keywords.filter((w) => lowerTitle.includes(w)).length;
            const descHits = keywords.filter((w) => lowerDesc.includes(w)).length;
            const authorHits = keywords.filter((w) => lowerAuthor.includes(w)).length;
            const categoryHits = keywords.filter((w) => lowerCategory.includes(w)).length;

            let combined = semScore;
            if (exactTitle) combined += 0.25;
            combined += Math.min(0.12, titleHits * 0.04);
            combined += Math.min(0.08, descHits * 0.02);
            combined += Math.min(0.10, authorHits * 0.05);
            combined += Math.min(0.06, categoryHits * 0.03);

            // For author-intent queries, boost author hits more aggressively
            if (intent === 'author' && authorHits > 0) combined += 0.20;

            // Acceptance gate: semantic score must be meaningful OR strong lexical signal
            const accepted =
              semScore >= semThreshold ||
              exactTitle ||
              titleHits >= 1 ||
              (descHits >= 2 && semScore >= semThreshold * 0.6) ||
              (authorHits >= 1 && intent === 'author');

            if (accepted) {
              scored.push({
                ...book,
                _relevance: {
                  score: Math.round(combined * 1000) / 1000,
                  semanticScore: Math.round(semScore * 1000) / 1000,
                  exactTitle,
                  titleHits,
                  descHits,
                  intent,
                  isSemanticMatch: semScore >= 0.22 && !exactTitle && titleHits === 0,
                },
              });
            }
          }

          if (scored.length > 0) {
            scored.sort((a, b) => b._relevance.score - a._relevance.score);
            const paged = scored.slice(skip, skip + limit);
            return {
              data: paged,
              total: scored.length,
              page: Math.max(1, page),
              limit,
              mode: 'semantic',
              hasSemanticResults: paged.some((b) => b._relevance?.isSemanticMatch),
            };
          }
        }
      }
    } catch (err) {
      const isRateLimit = err.message === 'GEMINI_RATE_LIMIT';
      const isConn = /connection|timeout|socket|econnrefused/i.test(err.message ?? '');

      if (isRateLimit) {
        // Fall through to lexical search — user still gets results, just keyword-based.
        // Re-throwing a 500 here left users with an empty page, which is worse.
        console.warn('[SEARCH] Gemini rate-limited, falling back to lexical search.');
      } else if (isConn) {
        throw err;
      } else {
        console.warn('[SEARCH] Non-fatal semantic error, falling back to lexical:', err.message ?? err);
      }
    }
  }

  // ------------------------------------------------------------------ //
  // 4. Lexical fallback — keyword-based DB query
  // ------------------------------------------------------------------ //
  // Use raw keywords only (no alias expansion) — expanded terms like 'sains', 'alam'
  // are too generic for SQL LIKE matching and cause false positives.
  const keywords = extractKeywords(raw);

  const wordConditions = keywords.slice(0, 8).flatMap((tok) => [
    { judul: { contains: tok, mode: 'insensitive' } },
    { deskripsi: { contains: tok, mode: 'insensitive' } },
    { penulis: { nama: { contains: tok, mode: 'insensitive' } } },
    { kategori: { nama: { contains: tok, mode: 'insensitive' } } },
  ]);

  const where = {
    AND: [
      wordConditions.length > 0
        ? { OR: wordConditions }
        : { judul: { contains: raw, mode: 'insensitive' } },
      categoryWhere,
    ],
  };

  const [data, total] = await Promise.all([
    prisma.buku.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: BOOK_INCLUDE,
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
