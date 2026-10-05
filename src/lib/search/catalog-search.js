import { prisma } from "../prisma.js";
import {
  computeEmbedding,
  computeBatchEmbeddings,
  calculateSimilarity,
} from "./embeddings.js";
import { transformQuery } from "./query-transform.js";
import { rerankCandidates } from "./reranker.js";

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
  return "title";
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
  const isJunk = (query ?? "").trim().length > 250 || /^[^a-zA-Z0-9]+$/.test((query ?? "").trim());
  const raw = (query ?? "").trim().slice(0, 300);
  const parsedKategoriId =
    kategoriId && !isNaN(parseInt(kategoriId, 10))
      ? parseInt(kategoriId, 10)
      : null;
  const skip = (Math.max(1, page) - 1) * limit;
  const categoryWhere = parsedKategoriId
    ? { kategoriId: parsedKategoriId }
    : {};

  if (!raw || isJunk) {
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

  const transformPromise = transformQuery(raw);

  if (searchMode !== "lexical") {
    try {
      const semanticQueryInitial = buildSemanticQuery(raw);

      const runFts = (q) => parsedKategoriId
        ? prisma.$queryRaw`
            SELECT id, ts_rank_cd(
              to_tsvector('simple', coalesce(judul, '') || ' ' || coalesce(deskripsi, '')),
              plainto_tsquery('simple', ${q})
            ) as "lexScore"
            FROM buku
            WHERE "kategori_id" = ${parsedKategoriId}
              AND to_tsvector('simple', coalesce(judul, '') || ' ' || coalesce(deskripsi, '')) @@ plainto_tsquery('simple', ${q})
            ORDER BY "lexScore" DESC
            LIMIT 35
          `.catch((e) => { console.warn("[SEARCH] FTS error:", e.message); return []; })
        : prisma.$queryRaw`
            SELECT id, ts_rank_cd(
              to_tsvector('simple', coalesce(judul, '') || ' ' || coalesce(deskripsi, '')),
              plainto_tsquery('simple', ${q})
            ) as "lexScore"
            FROM buku
            WHERE to_tsvector('simple', coalesce(judul, '') || ' ' || coalesce(deskripsi, '')) @@ plainto_tsquery('simple', ${q})
            ORDER BY "lexScore" DESC
            LIMIT 35
          `.catch((e) => { console.warn("[SEARCH] FTS error:", e.message); return []; });

      const [queryVector, rawLexical, cleanQuery] = await Promise.all([
        computeEmbedding(semanticQueryInitial, "RETRIEVAL_QUERY"),
        runFts(raw),
        transformPromise,
      ]);

      const lexicalMatches = (cleanQuery && cleanQuery !== raw)
        ? await runFts(cleanQuery)
        : rawLexical;

      const intent = detectIntent(cleanQuery || raw);

      let denseMatches = [];
      if (queryVector && queryVector.length === 1024) {
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
        const topSemScore = (denseMatches && denseMatches[0]?.semScore) ? Number(denseMatches[0].semScore) : 0;
        const semThreshold = Math.max(0.18, topSemScore - 0.12);
        const qualifiedDense = (denseMatches || []).filter((m) => Number(m.semScore) >= semThreshold);

        const rrfScores = new Map();
        const k = 60;

        qualifiedDense.forEach((m, rank) => {
          const score = 1 / (k + rank + 1);
          rrfScores.set(m.id, (rrfScores.get(m.id) || 0) + score);
        });

        (lexicalMatches || []).forEach((m, rank) => {
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

          const isRerankerEnabled = process.env.ENABLE_RERANKER === "true";
          if (isRerankerEnabled && orderedBooks.length > 1 && process.env.JINA_RERANKER_URL) {
            const topLexScore = lexicalMatches[0]?.id === orderedBooks[0]?.id ? Number(lexicalMatches[0].lexScore) : 0;
            const topDenseScore = qualifiedDense[0]?.id === orderedBooks[0]?.id ? Number(qualifiedDense[0].semScore) : 0;
            const secondDenseScore = (qualifiedDense.length > 1 && qualifiedDense[1]?.id === orderedBooks[1]?.id)
              ? Number(qualifiedDense[1].semScore)
              : 0;
            const denseMargin = topDenseScore - secondDenseScore;

            const isExactTitle =
              orderedBooks[0]?.judul?.toLowerCase() === raw.toLowerCase() ||
              orderedBooks[0]?.judul?.toLowerCase() === cleanQuery.toLowerCase();
            const isDecisiveMatch = isExactTitle || topDenseScore >= 0.83;

            if (!isDecisiveMatch) {
              try {
                const rrfEntries = Array.from(rrfScores.entries()).sort((a, b) => b[1] - a[1]);
                const topRrfScore = rrfEntries[0]?.[1] ?? 0;
                const secondRrfScore = rrfEntries[1]?.[1] ?? 0;
                const rrfMargin = topRrfScore - secondRrfScore;
                // Optimize payload size: send max 8 items
                const sliceSize = rrfMargin > 0.04 ? 4 : 8;

                const rerankSlice = orderedBooks.slice(0, sliceSize);
                const remainingSlice = orderedBooks.slice(sliceSize);
                const docStrings = rerankSlice.map((b) => {
                  const cat = b.kategori?.nama ? `Kategori: ${b.kategori.nama}. ` : '';
                  // Kurangi deskripsi dari 400 jadi 250 char biar upload ke Jina lebih cepet
                  const desc = b.deskripsi ? b.deskripsi.slice(0, 250) : '';
                  return `${b.judul}. ${cat}${desc}`.trim();
                });

                const rerankQuery = raw.length > (cleanQuery || '').length ? raw : (cleanQuery || raw);
                const rerankResults = await rerankCandidates({
                  query: rerankQuery,
                  documents: docStrings,
                  topN: Math.min(sliceSize, rerankSlice.length),
                  timeoutMs: parseInt(process.env.JINA_RERANKER_TIMEOUT_MS, 10) || 2500,
                });

                if (rerankResults && rerankResults.length > 0) {
                  const rerankedBooks = rerankResults
                    .filter((item) => item.score > 0.25)
                    .map((item) => {
                      const b = rerankSlice[item.index];
                      if (!b) return null;
                      return {
                        ...b,
                        _relevance: {
                          score: item.score,
                          isReranked: true,
                          isSemanticMatch: true,
                        },
                      };
                    })
                    .filter(Boolean);

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

  const cleanQuery = await transformPromise;
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

