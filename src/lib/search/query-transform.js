const transformCache = new Map();
const MAX_CACHE = 1000;

const CONVERSATIONAL_PREFIXES = [
  /^(tolong\s+)?(cariin|carikan|cari|mau\s+cari|pengen\s+cari)\s+(buku|novel|koleksi)?\s*(tentang|soal|mengenai|tema)?\s*/i,
  /^(apakah\s+ada|ada\s+gak|ada\s+nggak|ada\s+ngga|ada\s+ga|ada)\s+(buku|novel|koleksi|bukan)?\s*(tentang|tetang|soal|mengenai)?\s*/i,
  /^(punya\s+gak|punya\s+nggak|punya\s+ga|punya)\s+(buku|novel|koleksi)?\s*(tentang|soal|mengenai)?\s*/i,
  /^(saya|aku|gw|gue)\s+(mau|pengen|ingin)\s+(baca|cari|belajar)\s*(tentang|buku)?\s*/i,
  /^(rekomendasi|rekomendasikan)\s+(buku|novel)?\s*(tentang|soal)?\s*/i,
  /^(buku|novel)\s+(tentang|tetang|soal|mengenai|seputar)\s*/i,
  /^(gimana\s+caranya\s+supaya|gimana\s+caranya|bagaimana\s+cara|cara\s+agar)\s*/i,
];

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
  'jaman', 'zaman', 'baru', 'terbaru', 'cara', 'caranya', 'supaya', 'biar', 'tips', 'tutorial',
  'perpus', 'perpustakaan', 'bacaan', 'pas', 'saat', 'rasa', 'banyak', 'orang'
]);

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
  bujng: 'bujang',
  hrta: 'hirata',
  kngen: 'rindu',
  kpl: 'kapal',
  noll: 'zero',
  sru: 'satu',
  olshop: 'pemasaran digital bisnis',
  piten: 'python',
  psika: 'fisika',
};

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

  if (LOCAL_TERM_MAP[clean]) {
    return LOCAL_TERM_MAP[clean];
  }

  if (CATALOG_VOCABULARY.includes(clean)) {
    return clean;
  }

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

function sanitizeLlmKeywords(text) {
  if (!text) return null;
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\|[^>]*>?/g, '')
    .replace(/\b\d+\.\s*/g, '')
    .replace(/["\n\r.;,!?:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const NOISE = new Set([
    'perpustakaan', 'perpus', 'pencarian', 'query', 'buku', 'novel', 'kunci', 'kata',
    'keywords', 'berikut', 'hasil', 'rekomendasi', 'adalah', 'tentang',
    'tolong', 'cariin', 'carikan', 'mencari', 'koleksi', 'saat', 'rasa', 'banyak', 'orang', 'pas', 'bacaan'
  ]);

  const tokens = [...new Set(
    cleaned.split(/\s+/).filter((w) => w.length >= 2 && !NOISE.has(w) && !/^\d+$/.test(w))
  )];

  if (
    tokens.length >= 1 &&
    !cleaned.startsWith('here is') &&
    !cleaned.startsWith('here are') &&
    !cleaned.startsWith('kata kunci') &&
    !cleaned.startsWith('berikut')
  ) {
    return tokens.slice(0, 5).join(' ');
  }

  return null;
}

let _llmConfig = null;
function getLlmConfig() {
  if (_llmConfig) return _llmConfig;
  const baseUrl = process.env.OLLAMA_URL || process.env.LLM_URL;
  const model = process.env.OLLAMA_MODEL || process.env.LLM_MODEL;
  if (!baseUrl || !model) return null;

  const apiKey = process.env.OLLAMA_API_KEY || process.env.LLM_API_KEY || process.env.JINA_API_KEY || '';
  const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS, 10) || 2500;
  const cleanBase = baseUrl.replace(/\/+$/, '');

  const headers = { 'Content-Type': 'application/json', 'Connection': 'keep-alive' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const chatUrl = cleanBase.endsWith('/v1')
    ? `${cleanBase}/chat/completions`
    : `${cleanBase}/v1/chat/completions`;
  const ollamaUrl = `${cleanBase}/api/chat`;

  _llmConfig = { model, timeoutMs, headers, chatUrl, ollamaUrl };
  return _llmConfig;
}

export async function callLlmTransform(rawQuery) {
  if (!rawQuery) return null;
  const cfg = getLlmConfig();
  if (!cfg) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  const systemPrompt =
    'Ekstrak 1-4 kata kunci subjek atau topik utama buku (bidang ilmu, keahlian, objek spesifik, atau genre). Buang kata umum seperti panduan, cara, buku, dasar, tips. HANYA kata kunci dipisah spasi, huruf kecil:';

  try {
    const res = await fetch(cfg.chatUrl, {
      method: 'POST',
      headers: cfg.headers,
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: rawQuery },
        ],
        chat_template_kwargs: { enable_thinking: false },
        temperature: 0.0,
        max_tokens: 24,
      }),
      signal: controller.signal,
    });

    if (res.ok) {
      clearTimeout(timer);
      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      const sanitized = sanitizeLlmKeywords(rawText);
      if (sanitized) return sanitized;
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      clearTimeout(timer);
      return null;
    }
  }

  try {
    const res = await fetch(cfg.ollamaUrl, {
      method: 'POST',
      headers: cfg.headers,
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: rawQuery },
        ],
        stream: false,
        options: { num_ctx: 256, num_predict: 24, temperature: 0.0 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const rawText = data.message?.content || '';
      return sanitizeLlmKeywords(rawText);
    }
  } catch {
  } finally {
    clearTimeout(timer);
  }

  return null;
}

export const callOllamaTransform = callLlmTransform;

const CONVERSATIONAL_INTENT_PATTERN =
  /\b(gimana|bagaimana|kenapa|mengapa|rekomendasi|rekomendasikan|cocok|pengen|ingin|belajar|tutorial|tips|cara|bantu|minta|bikin|buat)\b/i;

export async function transformQuery(rawQuery = '') {
  const query = (rawQuery || '').trim();
  if (!query || query.length < 2) return query;

  const cacheKey = query.toLowerCase();
  if (transformCache.has(cacheKey)) {
    return transformCache.get(cacheKey);
  }

  let cleaned = query;
  let hasPrefix = false;
  for (const prefix of CONVERSATIONAL_PREFIXES) {
    if (prefix.test(cleaned)) {
      hasPrefix = true;
      cleaned = cleaned.replace(prefix, '').trim();
      break;
    }
  }

  const rawWords = (cleaned || query).split(/\s+/);
  const substantiveWords = rawWords.filter((w) => {
    const cleanW = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanW && !CONVERSATIONAL_STOPWORDS.has(cleanW);
  });

  const wordsToProcess = substantiveWords.length > 0 ? substantiveWords : rawWords;

  const correctedWords = wordsToProcess.flatMap((w) => {
    const mapped = fuzzyCorrectWord(w);
    return mapped.split(/\s+/);
  });

  const uniqueWords = [...new Set(correctedWords.filter(Boolean))];
  const localResult = uniqueWords.join(' ').trim();

  let finalResult = localResult || query;

  const enableLlm = process.env.ENABLE_LLM_TRANSFORM !== 'false';
  const hasIntentMarker = CONVERSATIONAL_INTENT_PATTERN.test(query);
  const isExactVocabMatch = uniqueWords.length === 1 && CATALOG_VOCABULARY.includes(uniqueWords[0].toLowerCase());
  const isCleanDirectQuery = uniqueWords.length >= 1 && uniqueWords.length <= 3 && !hasIntentMarker;

  const shouldInvokeLlm =
    enableLlm &&
    !isExactVocabMatch &&
    !isCleanDirectQuery &&
    (substantiveWords.length >= 4 || hasIntentMarker || (hasPrefix && substantiveWords.length >= 3));

  if (shouldInvokeLlm) {
    const llmResult = await callLlmTransform(query);
    if (llmResult) {
      const llmTokens = llmResult.split(/\s+/).filter((w) => {
        const cw = w.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cw && !CONVERSATIONAL_STOPWORDS.has(cw);
      });
      if (llmTokens.length > 0) {
        const expanded = llmTokens.flatMap((w) => fuzzyCorrectWord(w).split(/\s+/));
        finalResult = [...new Set(expanded.filter(Boolean))].join(' ').trim();
      }
    }
  }

  if (transformCache.size >= MAX_CACHE) {
    transformCache.delete(transformCache.keys().next().value);
  }
  transformCache.set(cacheKey, finalResult);

  return finalResult;
}
