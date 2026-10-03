/**
 * Local Deterministic Query Transformation Layer
 * 100% Local, 0ms Latency, Zero API Cost.
 * 
 * Features:
 * 1. Token-level Conversational & Noise Stripping ("ada bukan tetang oding gak" -> "oding")
 * 2. Slang & Typo Mapping ("oding" / "koding" -> "pemrograman")
 * 3. Levenshtein Fuzzy Typo Correction against catalog vocabulary ("komukasi" -> "komunikasi")
 * 4. Optional Ollama integration via OLLAMA_URL in .env with safe fallback
 * 5. In-Memory LRU Cache
 */

const transformCache = new Map();
const MAX_CACHE = 1000;

// Conversational filler phrases that degrade vector & keyword accuracy
const CONVERSATIONAL_PREFIXES = [
  /^(tolong\s+)?(cariin|carikan|cari|mau\s+cari|pengen\s+cari)\s+(buku|novel|koleksi)?\s*(tentang|soal|mengenai|tema)?\s*/i,
  /^(apakah\s+ada|ada\s+gak|ada\s+nggak|ada\s+ngga|ada\s+ga|ada)\s+(buku|novel|koleksi|bukan)?\s*(tentang|tetang|soal|mengenai)?\s*/i,
  /^(punya\s+gak|punya\s+nggak|punya\s+ga|punya)\s+(buku|novel|koleksi)?\s*(tentang|soal|mengenai)?\s*/i,
  /^(saya|aku|gw|gue)\s+(mau|pengen|ingin)\s+(baca|cari|belajar)\s*(tentang|buku)?\s*/i,
  /^(rekomendasi|rekomendasikan)\s+(buku|novel)?\s*(tentang|soal)?\s*/i,
  /^(buku|novel)\s+(tentang|tetang|soal|mengenai|seputar)\s*/i,
  /^(gimana\s+caranya\s+supaya|gimana\s+caranya|bagaimana\s+cara|cara\s+agar)\s*/i,
];

// Single-word filler stopwords that can be stripped when searching catalog
const CONVERSATIONAL_STOPWORDS = new Set([
  'ada', 'apakah', 'punya', 'buku', 'uuku', 'bku', 'bukan', 'novel', 'koleksi',
  'cariin', 'carikan', 'gitu', 'tolong', 'buat',
  'tentang', 'tetang', 'ttg', 'soal', 'mengenai', 'seputar', 'hal', 'ngebahas', 'bahas',
  'gak', 'nggak', 'ga', 'ngga', 'tidak', 'enggak',
  'dong', 'deh', 'nih', 'ya', 'sih', 'lah', 'yg', 'yang',
  'mau', 'ingin', 'pengen', 'cari', 'cariin', 'carikan', 'mencari',
  'tolong', 'kasih', 'bisa', 'buat', 'untuk', 'di', 'dan', 'atau', 'ke', 'dari',
  'saya', 'aku', 'gw', 'gue', 'lu', 'kamu', 'rekomendasi',
  'sesuatu', 'ngilangin', 'baca', 'bacain', 'hilang', 'bikin', 'nghilangin',
  'bantu', 'minta', 'lagi', 'paling', 'banget', 'kek', 'kayak',
  'jaman', 'zaman', 'baru', 'terbaru', 'cara', 'caranya', 'supaya', 'biar', 'tips', 'tutorial'
]);

// Slang, abbreviations, and informal typos
const LOCAL_TERM_MAP = {
  koding: 'pemrograman',
  kodingan: 'pemrograman',
  coding: 'pemrograman',
  codingan: 'pemrograman',
  ngoding: 'pemrograman',
  ngodingan: 'pemrograman',
  oding: 'pemrograman',
  kodink: 'pemrograman',
  pemograman: 'pemrograman',
  programing: 'pemrograman',
  programming: 'pemrograman',
  kompiuter: 'komputer',
  kompie: 'komputer',
  db: 'basis data',
  database: 'basis data',
  ai: 'kecerdasan buatan',
  ml: 'machine learning',
  mtk: 'matematika',
  mate: 'matematika',
  cuan: 'bisnis keuangan investasi',
  galau: 'novel fiksi roman',
  gabut: 'novel fiksi sastra',
  healing: 'pengembangan diri motivasi',
  stres: 'kesehatan mental psikologi',
  resep: 'resep masakan',
  masak: 'kuliner memasak',
  boga: 'tata boga',
  hotel: 'perhotelan pariwisata',
  wisata: 'pariwisata',
  sjarah: 'sejarah',
  indo: 'indonesia',
  blnda: 'belanda',
  ui: 'desain ui',
  ux: 'desain ux',
  figma: 'desain ui ux',
  publis: 'public',
  nangis: 'novel fiksi sedih',
  males: 'motivasi',
};

// High-frequency library catalog terms for fuzzy typo auto-correction
const CATALOG_VOCABULARY = [
  'komunikasi',
  'pemrograman',
  'komputer',
  'manajemen',
  'perhotelan',
  'pariwisata',
  'kuliner',
  'akuntansi',
  'keuangan',
  'kewirausahaan',
  'pemasaran',
  'psikologi',
  'sosiologi',
  'antropologi',
  'filsafat',
  'sastra',
  'matematika',
  'statistika',
  'kalkulus',
  'biologi',
  'fisika',
  'kimia',
  'kedokteran',
  'farmakologi',
  'patologi',
  'anatomi',
  'jurnalistik',
  'retorika',
  'linguistik',
  'algoritma',
  'jaringan',
  'database',
  'robotika',
  'sejarah',
  'ekonomi',
  'hukum',
  'politik',
  'bahasa',
  'inggris',
  'mandarin',
  'jepang',
  'arab',
  'pastry',
  'bakery',
  'barista',
  'restoran',
  'mocktail',
  'sanitasi',
  'hygiene',
  'housekeeping',
  'investasi',
  'branding',
  'copywriting',
];

// Fast Levenshtein distance for word-level typo correction
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = [];
  for (let i = 0; i <= b.length; i++) row[i] = i;

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

function fuzzyCorrectWord(word) {
  const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean || clean.length < 3) return word;

  // 1. Direct slang / typo map (0ms)
  if (LOCAL_TERM_MAP[clean]) {
    return LOCAL_TERM_MAP[clean];
  }

  // 2. Exact match in catalog vocab
  if (CATALOG_VOCABULARY.includes(clean)) {
    return clean;
  }

  // 3. Levenshtein fuzzy match
  let closestMatch = null;
  let minDistance = Infinity;
  const maxAllowed = clean.length >= 6 ? 2 : 1;

  for (const target of CATALOG_VOCABULARY) {
    if (Math.abs(clean.length - target.length) > maxAllowed) continue;

    const dist = levenshtein(clean, target);
    if (dist < minDistance) {
      minDistance = dist;
      closestMatch = target;
    }
  }

  if (minDistance <= maxAllowed && closestMatch) {
    return closestMatch;
  }

  return word;
}

async function callOllamaTransform(rawQuery) {
  const ollamaUrl = process.env.OLLAMA_URL;
  if (!ollamaUrl) return null;
  const model = process.env.OLLAMA_MODEL || 'llama3.2:1b-instruct-q4_K_M';
  const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS, 10) || 2000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Use /api/chat so Ollama applies the correct Llama 3.2 chat template
    // instead of us trying to embed raw <|system|> tokens in /api/generate
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            // Extractive-only: model MUST pick words from the query, not generate new ones
            content: 'Kamu adalah ekstraktor kata kunci perpustakaan. Pilih 1-4 kata paling penting dari query pengguna. HANYA gunakan kata yang ADA dalam query. Balas HANYA kata-kata tersebut dipisah spasi. Dilarang membuat kata baru.',
          },
          { role: 'user', content: rawQuery },
        ],
        stream: false,
        keep_alive: '60m',
        options: {
          num_ctx: 256,
          num_predict: 16,
          temperature: 0.0,
          // min_p forces model to always pick from tokens with >5% probability
          // mass — prevents the 0-token generation that triggers Ollama's
          // "output must contain either text or tool calls" validation error
          min_p: 0.05,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      // Drain body to avoid connection leak; don't surface the error upstream
      await res.text().catch(() => {});
      return null;
    }

    if (res.ok) {
      const data = await res.json();
      const rawText = (data.message?.content || '')
        // Strip any partial or full chat template artifacts
        .replace(/<\|[^>]*>?/g, '')
        // Strip numbered list prefixes ("1.", "2.", etc.)
        .replace(/\b\d+\.\s*/g, '')
        // Strip punctuation and normalize whitespace
        .replace(/["\n\r.;,!?:]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      // Noise words the model tends to hallucinate from the system prompt
      const NOISE = new Set(['perpustakaan', 'pencarian', 'query', 'buku', 'kata', 'kunci', 'keywords']);

      const tokens = [...new Set(
        rawText.split(/\s+/).filter((w) => w.length >= 2 && !NOISE.has(w) && !/^\d+$/.test(w))
      )];

      if (
        tokens.length >= 1 &&
        !rawText.startsWith('here is') &&
        !rawText.startsWith('here are') &&
        !rawText.startsWith('kata kunci') &&
        !rawText.startsWith('berikut')
      ) {
        return tokens.slice(0, 4).join(' ');
      }
    }
  } catch {
    // Timeout, network error, or empty-output Ollama error — fall back silently
  } finally {
    clearTimeout(timer);
  }

  return null;
}

export async function transformQuery(rawQuery = '') {
  const query = (rawQuery || '').trim();
  if (!query || query.length < 2) return query;

  const cacheKey = query.toLowerCase();
  if (transformCache.has(cacheKey)) {
    return transformCache.get(cacheKey);
  }

  // 1. Strip conversational filler prefix if present
  let cleaned = query;
  for (const prefix of CONVERSATIONAL_PREFIXES) {
    if (prefix.test(cleaned)) {
      cleaned = cleaned.replace(prefix, '').trim();
      break;
    }
  }

  // 2. Tokenize and filter conversational stopwords
  const rawWords = (cleaned || query).split(/\s+/);
  const substantiveWords = rawWords.filter((w) => {
    const cleanW = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanW && !CONVERSATIONAL_STOPWORDS.has(cleanW);
  });

  // If all words were stopwords (e.g. user just searched "buku"), keep original words
  const wordsToProcess = substantiveWords.length > 0 ? substantiveWords : rawWords;

  // 3. Fast-Path: Deterministic typo, slang, and dictionary normalization
  const correctedWords = wordsToProcess.flatMap((w) => {
    const mapped = fuzzyCorrectWord(w);
    return mapped.split(/\s+/);
  });

  // Deduplicate words to avoid repetitions like "masakan masakan"
  const uniqueWords = [...new Set(correctedWords.filter(Boolean))];
  const localResult = uniqueWords.join(' ').trim();

  let finalResult = localResult || query;

  // 4. Conditional LLM Pass:
  // Invoke Ollama only when:
  // - ENABLE_LLM_TRANSFORM is enabled (true by default)
  // - Query is complex/descriptive (>= 4 substantive words)
  // - Did not already match a simple exact catalog vocabulary word
  const enableLlm = process.env.ENABLE_LLM_TRANSFORM !== 'false';
  // Raise threshold: LLM only fires on genuinely long/ambiguous queries (≥ 6 words)
  // For 1-5 word queries, local deterministic is already accurate enough
  const isComplexQuery = substantiveWords.length >= 6;
  const isExactVocabMatch = uniqueWords.length === 1 && CATALOG_VOCABULARY.includes(uniqueWords[0].toLowerCase());

  if (enableLlm && isComplexQuery && !isExactVocabMatch) {
    const llmResult = await callOllamaTransform(query);
    if (llmResult) {
      const llmTokens = llmResult.split(/\s+/).filter((w) => {
        const cw = w.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cw && !CONVERSATIONAL_STOPWORDS.has(cw);
      });
      if (llmTokens.length > 0) {
        finalResult = [...new Set(llmTokens.map(fuzzyCorrectWord))].join(' ').trim();
      }
    }
  }

  // 5. In-Memory LRU Cache
  if (transformCache.size >= MAX_CACHE) {
    transformCache.delete(transformCache.keys().next().value);
  }
  transformCache.set(cacheKey, finalResult);

  return finalResult;
}
