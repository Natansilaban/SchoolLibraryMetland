import { prisma } from "@/lib/prisma";
import {
  computeEmbedding,
  computeBatchEmbeddings,
  calculateSimilarity,
} from "@/lib/search/embeddings";
import { transformQuery } from "@/lib/search/query-transform";
import { rerankCandidates } from "@/lib/search/reranker";

const STOP_WORDS = new Set([
  "cariin",
  "cari",
  "cariakan",
  "carikan",
  "kasih",
  "tolong",
  "dong",
  "deh",
  "nih",
  "buku",
  "judul",
  "novel",
  "kategori",
  "koleksi",
  "perpustakaan",
  "tentang",
  "mengenai",
  "berkaitan",
  "berhubungan",
  "soal",
  "hal",
  "yang",
  "ada",
  "di",
  "dan",
  "atau",
  "dengan",
  "untuk",
  "buat",
  "dari",
  "ke",
  "ini",
  "itu",
  "juga",
  "lebih",
  "paling",
  "sangat",
  "gak",
  "enggak",
  "tidak",
  "gw",
  "aku",
  "saya",
  "mau",
  "pengen",
  "ingin",
  "minta",
  "info",
  "ada",
  "apa",
  "itu",
  "ga",
  "ngga",
  "nggak",
  "kalo",
  "kalau",
  "bisa",
]);

const LEXICAL_STOP_WORDS = new Set([
  "cariin",
  "cari",
  "cariakan",
  "carikan",
  "kasih",
  "tolong",
  "dong",
  "deh",
  "nih",
  "buku",
  "tentang",
  "mengenai",
  "soal",
  "hal",
  "berkaitan",
  "berhubungan",
  "bikin",
  "cara",
  "yang",
  "ada",
  "di",
  "dan",
  "atau",
  "dengan",
  "untuk",
  "buat",
  "dari",
  "ke",
  "ini",
  "itu",
  "juga",
  "lebih",
  "paling",
  "sangat",
  "gak",
  "enggak",
  "tidak",
  "gw",
  "aku",
  "saya",
  "mau",
  "pengen",
  "ingin",
  "minta",
  "info",
  "apa",
  "ga",
  "ngga",
  "nggak",
  "kalo",
  "kalau",
  "bisa",
]);

const ALIAS_MAP = {
  koding: "pemrograman komputer",
  coding: "pemrograman komputer",
  ngoding: "pemrograman komputer",
  programing: "pemrograman",
  programming: "pemrograman komputer",
  web: "pengembangan web pemrograman",
  python: "pemrograman python",
  javascript: "pemrograman javascript web",
  jaringan: "jaringan komputer teknologi",
  ai: "kecerdasan buatan machine learning",
  ml: "machine learning kecerdasan buatan",
  database: "basis data pemrograman",
  sql: "basis data database relational",

  gabut: "sastra fiksi novel hiburan kumpulan cerita",
  bosen: "sastra fiksi novel hiburan komik",
  galau: "novel roman percintaan psikologi emosi",
  healing: "psikologi pengembangan diri self improvement motivasi",
  sedih: "psikologi motivasi hiburan self help",
  stres: "psikologi kesehatan mental self help",
  cuan: "bisnis kewirausahaan keuangan investasi saham uang",
  pr: "pelajaran sekolah referensi edukasi ujian",
  tugas: "pelajaran sekolah referensi edukasi kuliah akademi",
  skripsi: "metodologi penelitian jurnal referensi ilmiah",
  keren: "pengembangan diri tokoh inspiratif",
  masak: "kuliner memasak resep makanan",
  makanan: "kuliner pangan tata boga",

  science: "sains alam",
  math: "matematika logika",
  history: "sejarah sosial budaya",
  language: "bahasa komunikasi",
  english: "bahasa inggris",
  business: "kewirausahaan bisnis",
  travel: "pariwisata jurnal perjalanan",
  health: "kesehatan kedokteran medis",
  art: "seni budaya",
  design: "desain seni arsitektur",

  hotel: "perhotelan hospitality",
  wisata: "pariwisata",
  bisnis: "kewirausahaan bisnis",
  dagang: "kewirausahaan perdagangan",
  sastra: "sastra fiksi novel",
  novel: "sastra fiksi novel",
  cerpen: "sastra fiksi cerita pendek",
  fisika: "fisika sains alam",
  kimia: "kimia sains",
  biologi: "biologi sains alam",
  matematika: "matematika logika",
  sejarah: "sejarah sosial budaya",
  bahasa: "bahasa komunikasi",
  inggris: "bahasa inggris komunikasi",
  politik: "politik pemerintahan sosial tata negara",
  hukum: "hukum perundang-undangan regulasi",
};

function detectIntent(raw) {
  const lower = raw.toLowerCase();

  if (/^\d[\d\s-]{8,16}[\dxX]$/.test(raw.replace(/\s/g, ""))) return "isbn";

  if (/\b(karya|oleh|penulis|pengarang|author)\b/.test(lower)) return "author";

  if (
    /\b(tentang|mengenai|soal|topik|tema|berhubungan|berkaitan|membahas)\b/.test(
      lower,
    )
  )
    return "topic";
  return "title"; // default
}

function buildSemanticQuery(raw) {
  const tokens = raw.toLowerCase().split(/[\s,.\-!?;:]+/);
  const aliases = [];

  for (const t of tokens) {
    if (ALIAS_MAP[t]) {
      aliases.push(ALIAS_MAP[t]);
    }
  }

  if (aliases.length > 0) {
    const uniqueAliases = [...new Set(aliases)].join(" ");
    return `${raw} ${uniqueAliases}`;
  }

  return raw;
}

function extractKeywords(raw, stopWords = LEXICAL_STOP_WORDS) {
  return raw
    .toLowerCase()
    .split(/[\s,.\-!?;:]+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w));
}

function isBibliographicCode(q) {
  return /^\d{9,13}[\dxX]?$/.test(q.replace(/[\s-]/g, ""));
}

function bookEmbedText(book) {
  return [
    book.judul,
    book.kategori?.nama ? `Kategori: ${book.kategori.nama}` : "",
    book.deskripsi ?? "",
  ]
    .filter(Boolean)
    .join(". ");
}

const BOOK_INCLUDE = {
  kategori: { select: { id: true, nama: true } },
  penulis: { select: { id: true, nama: true } },
  penerbit: { select: { id: true, nama: true } },
  _count: { select: { peminjaman: true } },
};

export async function searchCatalog({
  query = "",
  kategoriId = null,
  page = 1,
  limit = 20,
  searchMode = "auto",
} = {}) {
  const raw = (query ?? "").trim().slice(0, 300);
  const parsedKategoriId =
    kategoriId && !isNaN(parseInt(kategoriId, 10))
      ? parseInt(kategoriId, 10)
      : null;
  const skip = (Math.max(1, page) - 1) * limit;
  const categoryWhere = parsedKategoriId
    ? { kategoriId: parsedKategoriId }
    : {};

  if (!raw) {
    const [data, total] = await Promise.all([
      prisma.buku.findMany({
        where: categoryWhere,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: BOOK_INCLUDE,
      }),
      prisma.buku.count({ where: categoryWhere }),
    ]);
    return {
      data,
      total,
      page: Math.max(1, page),
      limit,
      mode: "browse",
      hasSemanticResults: false,
    };
  }

  if (isBibliographicCode(raw)) {
    const clean = raw.replace(/[\s-]/g, "");
    const where = {
      AND: [
        {
          OR: [
            { isbn: { contains: clean, mode: "insensitive" } },
            { judul: { contains: raw, mode: "insensitive" } },
          ],
        },
        categoryWhere,
      ],
    };
    const [data, total] = await Promise.all([
      prisma.buku.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: BOOK_INCLUDE,
      }),
      prisma.buku.count({ where }),
    ]);
    return {
      data,
      total,
      page: Math.max(1, page),
      limit,
      mode: "exact",
      hasSemanticResults: false,
    };
  }

  // 1. Query Transformation (LLM Layer / Typo Correction)
  const cleanQuery = await transformQuery(raw);

  if (searchMode !== "lexical") {
    try {
      const intent = detectIntent(cleanQuery);
      const semanticQuery = buildSemanticQuery(cleanQuery);

      // 2a. Parallel Pipeline: Launch Lexical FTS concurrently with Vector Embedding!
      const lexicalPromise = (async () => {
        try {
          return parsedKategoriId
            ? await prisma.$queryRaw`
                SELECT id, ts_rank_cd(
                  to_tsvector('simple', coalesce(judul, '') || ' ' || coalesce(deskripsi, '')),
                  plainto_tsquery('simple', ${cleanQuery})
                ) as "lexScore"
                FROM buku
                WHERE "kategori_id" = ${parsedKategoriId}
                  AND to_tsvector('simple', coalesce(judul, '') || ' ' || coalesce(deskripsi, '')) @@ plainto_tsquery('simple', ${cleanQuery})
                ORDER BY "lexScore" DESC
                LIMIT 35
              `
            : await prisma.$queryRaw`
                SELECT id, ts_rank_cd(
                  to_tsvector('simple', coalesce(judul, '') || ' ' || coalesce(deskripsi, '')),
                  plainto_tsquery('simple', ${cleanQuery})
                ) as "lexScore"
                FROM buku
                WHERE to_tsvector('simple', coalesce(judul, '') || ' ' || coalesce(deskripsi, '')) @@ plainto_tsquery('simple', ${cleanQuery})
                ORDER BY "lexScore" DESC
                LIMIT 35
              `;
        } catch (ftsErr) {
          console.warn("[SEARCH] FTS query error, proceeding with vector:", ftsErr.message);
          return [];
        }
      })();

      const [queryVector, lexicalMatches] = await Promise.all([
        computeEmbedding(semanticQuery, "RETRIEVAL_QUERY"),
        lexicalPromise,
      ]);

      let denseMatches = [];
      if (queryVector) {
        const vectorStr = `[${Array.from(queryVector).join(",")}]`;

        denseMatches = parsedKategoriId
          ? await prisma.$queryRaw`
              SELECT id, 1 - (embedding <=> ${vectorStr}::vector) as "semScore"
              FROM buku
              WHERE "kategori_id" = ${parsedKategoriId} AND embedding IS NOT NULL
              ORDER BY embedding <=> ${vectorStr}::vector
              LIMIT 35
            `
          : await prisma.$queryRaw`
              SELECT id, 1 - (embedding <=> ${vectorStr}::vector) as "semScore"
              FROM buku
              WHERE embedding IS NOT NULL
              ORDER BY embedding <=> ${vectorStr}::vector
              LIMIT 35
            `;
      }

      if (denseMatches.length > 0 || lexicalMatches.length > 0) {
        // 2c. Reciprocal Rank Fusion (RRF) with Adaptive Semantic Thresholding
        const topSemScore = (denseMatches && denseMatches[0]?.semScore) ? Number(denseMatches[0].semScore) : 0;
        // Require at least 0.28 or within 0.08 of top score to eliminate random library books
        const semThreshold = Math.max(0.27, topSemScore - 0.08);
        const qualifiedDense = (denseMatches || []).filter((m) => Number(m.semScore) >= semThreshold);

        const rrfScores = new Map();
        const k = 60; // Standard RRF smoothing constant

        qualifiedDense.forEach((m, rank) => {
          const score = 1 / (k + rank + 1);
          rrfScores.set(m.id, (rrfScores.get(m.id) || 0) + score);
        });

        (lexicalMatches || []).forEach((m, rank) => {
          // Boost exact lexical token matches so exact keywords always rank high
          const score = 1.5 / (k + rank + 1);
          rrfScores.set(m.id, (rrfScores.get(m.id) || 0) + score);
        });

        const fusedIds = Array.from(rrfScores.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id)
          .slice(0, 25);

        if (fusedIds.length > 0) {
          const candidates = await prisma.buku.findMany({
            where: { id: { in: fusedIds } },
            include: BOOK_INCLUDE,
          });

          const bookMap = new Map(candidates.map((b) => [b.id, b]));
          let orderedBooks = fusedIds
            .map((id) => bookMap.get(id))
            .filter(Boolean);

          // 3. Stage 2: Reranking Node (Jina Reranker v3 / v3.5)
          const isRerankerEnabled = process.env.ENABLE_RERANKER === "true";
          if (isRerankerEnabled && orderedBooks.length > 1 && process.env.JINA_RERANKER_URL) {
            // High-Confidence Stage 1 Short-Circuit:
            // If top candidate has an exact lexical match or strong dense match,
            // Stage 1 is already conclusive. Skip slow CPU reranker!
            const topLexScore = lexicalMatches[0]?.id === orderedBooks[0]?.id ? Number(lexicalMatches[0].lexScore) : 0;
            const topDenseScore = qualifiedDense[0]?.id === orderedBooks[0]?.id ? Number(qualifiedDense[0].semScore) : 0;
            const isDecisiveMatch = topLexScore > 0.4 || topDenseScore > 0.88;

            if (!isDecisiveMatch) {
              try {
                // Rerank top 3 candidates (concise format) to keep CPU cross-attention fast
                const rerankSlice = orderedBooks.slice(0, 3);
                const remainingSlice = orderedBooks.slice(3);
                const docStrings = rerankSlice.map((b) => `${b.judul}. Kategori: ${b.kategori?.nama || ''}`);

                const rerankResults = await rerankCandidates({
                  query: cleanQuery,
                  documents: docStrings,
                  topN: 3,
                  timeoutMs: parseInt(process.env.JINA_RERANKER_TIMEOUT_MS, 10) || 2500,
                });

                if (rerankResults && rerankResults.length > 0) {
                  const rerankedBooks = [];
                  for (const item of rerankResults) {
                    // Prune negative scores (Jina v3 scores < 0 mean irrelevant)
                    if (item.score > -0.02 && rerankSlice[item.index]) {
                      const b = rerankSlice[item.index];
                      rerankedBooks.push({
                        ...b,
                        _relevance: {
                          score: item.score,
                          isReranked: true,
                          isSemanticMatch: true,
                        },
                      });
                    }
                  }

                  if (rerankedBooks.length > 0) {
                    orderedBooks = [...rerankedBooks, ...remainingSlice];
                  }
                }
              } catch (rerankErr) {
                console.warn(
                  "[SEARCH] Reranker failed, keeping Stage 1 RRF order:",
                  rerankErr.message || rerankErr,
                );
              }
            }
          }


          if (orderedBooks.length > 0) {
            const paged = orderedBooks.slice(skip, skip + limit);
            return {
              data: paged,
              total: orderedBooks.length,
              page: Math.max(1, page),
              limit,
              mode: "hybrid",
              hasSemanticResults: true,
            };
          }
        }
      }
    } catch (err) {
      console.warn(
        "[SEARCH] Non-fatal semantic error, falling back to lexical:",
        err.message ?? err,
      );
    }
  }

  // 4. Fallback: Word token search
  const keywords = extractKeywords(cleanQuery || raw);

  const wordConditions = keywords
    .slice(0, 8)
    .flatMap((tok) => [
      { judul: { contains: tok, mode: "insensitive" } },
      { deskripsi: { contains: tok, mode: "insensitive" } },
      { penulis: { nama: { contains: tok, mode: "insensitive" } } },
      { kategori: { nama: { contains: tok, mode: "insensitive" } } },
    ]);

  const where = {
    AND: [
      wordConditions.length > 0
        ? { OR: wordConditions }
        : { judul: { contains: raw, mode: "insensitive" } },
      categoryWhere,
    ],
  };

  const [data, total] = await Promise.all([
    prisma.buku.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: BOOK_INCLUDE,
    }),
    prisma.buku.count({ where }),
  ]);

  return {
    data,
    total,
    page: Math.max(1, page),
    limit,
    mode: "lexical",
    hasSemanticResults: false,
  };
}

