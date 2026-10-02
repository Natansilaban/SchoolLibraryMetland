import { prisma } from "@/lib/prisma";
import {
  computeEmbedding,
  computeBatchEmbeddings,
  calculateSimilarity,
} from "@/lib/search/embeddings";

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

  if (searchMode !== "lexical") {
    try {
      const intent = detectIntent(raw);
      const semanticQuery = buildSemanticQuery(raw);
      const keywords = extractKeywords(raw);
      const lowerRaw = raw.toLowerCase();

      const queryVector = await computeEmbedding(
        semanticQuery,
        "RETRIEVAL_QUERY",
      );

      if (queryVector) {
        const vectorStr = `[${Array.from(queryVector).join(",")}]`;

        let candidateIdsQuery;
        if (options.kategoriId) {
          candidateIdsQuery = prisma.$queryRaw`
            SELECT id, 1 - (embedding <=> ${vectorStr}::vector) as "semScore"
            FROM buku
            WHERE "kategori_id" = ${options.kategoriId} AND embedding IS NOT NULL
            ORDER BY embedding <=> ${vectorStr}::vector
            LIMIT 500
          `;
        } else {
          candidateIdsQuery = prisma.$queryRaw`
            SELECT id, 1 - (embedding <=> ${vectorStr}::vector) as "semScore"
            FROM buku
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> ${vectorStr}::vector
            LIMIT 500
          `;
        }

        const vectorMatches = await candidateIdsQuery;
        const candidateIds = vectorMatches.map((m) => m.id);

        if (candidateIds.length > 0) {
          const candidates = await prisma.buku.findMany({
            where: { id: { in: candidateIds } },
            include: BOOK_INCLUDE,
          });

          const semScoreMap = new Map(
            vectorMatches.map((m) => [m.id, m.semScore]),
          );
          const candidateData = candidates.map((book) => ({
            book,
            semScore: semScoreMap.get(book.id) || 0,
          }));

          let maxSemScore = 0;
          for (const item of candidateData) {
            if (item.semScore > maxSemScore) maxSemScore = item.semScore;
          }

          const isJina = queryVector.length === 1024;

          const semFloor = isJina ? 0.35 : 0.2;

          const adaptiveMargin = isJina ? 0.15 : 0.12;
          const semThreshold = Math.max(semFloor, maxSemScore - adaptiveMargin);

          const scored = [];
          for (const { book, vec, semScore } of candidateData) {
            if (!vec || vec.length !== queryVector.length) continue;

            const lowerTitle = book.judul.toLowerCase();
            const lowerDesc = (book.deskripsi ?? "").toLowerCase();
            const lowerAuthor = (book.penulis?.nama ?? "").toLowerCase();
            const lowerCategory = (book.kategori?.nama ?? "").toLowerCase();

            const exactTitle = lowerTitle.includes(lowerRaw);
            const titleHits = keywords.filter((w) =>
              lowerTitle.includes(w),
            ).length;
            const descHits = keywords.filter((w) =>
              lowerDesc.includes(w),
            ).length;
            const authorHits = keywords.filter((w) =>
              lowerAuthor.includes(w),
            ).length;
            const categoryHits = keywords.filter((w) =>
              lowerCategory.includes(w),
            ).length;

            let combined = semScore;
            if (exactTitle) combined += 0.25;
            combined += Math.min(0.12, titleHits * 0.04);
            combined += Math.min(0.08, descHits * 0.02);
            combined += Math.min(0.1, authorHits * 0.05);
            combined += Math.min(0.06, categoryHits * 0.03);

            if (intent === "author" && authorHits > 0) combined += 0.2;

            const accepted =
              semScore >= semThreshold ||
              exactTitle ||
              titleHits >= 1 ||
              (descHits >= 2 && semScore >= semThreshold * 0.6) ||
              (authorHits >= 1 && intent === "author");

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
                  isSemanticMatch:
                    semScore >= 0.22 && !exactTitle && titleHits === 0,
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
              mode: "semantic",
              hasSemanticResults: paged.some(
                (b) => b._relevance?.isSemanticMatch,
              ),
            };
          }
        }
      }
    } catch (err) {
      const isRateLimit = err.message === "GEMINI_RATE_LIMIT";
      const isConn = /connection|timeout|socket|econnrefused/i.test(
        err.message ?? "",
      );

      if (isRateLimit) {
        console.warn(
          "[SEARCH] Gemini rate-limited, falling back to lexical search.",
        );
      } else if (isConn) {
        throw err;
      } else {
        console.warn(
          "[SEARCH] Non-fatal semantic error, falling back to lexical:",
          err.message ?? err,
        );
      }
    }
  }

  const keywords = extractKeywords(raw);

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
