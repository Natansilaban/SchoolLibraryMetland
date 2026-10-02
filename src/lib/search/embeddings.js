

const embeddingCache = new Map();
const MAX_CACHE_SIZE = 3000;

let localPipeline = null;
let localInitPromise = null;
let jinaDisabled = false;
let jinaDisableLogged = false;
let lastProvider = 'unknown';

export function getActiveProvider() { return lastProvider; }

function lruSet(key, value) {
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    embeddingCache.delete(embeddingCache.keys().next().value);
  }
  embeddingCache.set(key, value);
}

async function getLocalPipeline() {
  if (localPipeline) return localPipeline;
  if (localInitPromise) return localInitPromise;

  localInitPromise = (async () => {
    try {
      const { pipeline } = await import('@huggingface/transformers');
      localPipeline = await pipeline(
        'feature-extraction',
        'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
        { dtype: 'q8' }
      );
      return localPipeline;
    } catch (err) {
      console.warn('[EMBEDDINGS] Local ONNX pipeline failed to load:', err?.message ?? err);
      return null;
    } finally {
      localInitPromise = null;
    }
  })();

  return localInitPromise;
}

async function computeJinaEmbedding(text, taskType) {
  if (jinaDisabled) return null;

  try {
    const jinaApiUrl = process.env.JINA_API_URL || 'https://jina.r1fikri.dev/v1/embeddings';
    const jinaApiKey = process.env.JINA_API_KEY || '';
    const headers = { 'Content-Type': 'application/json' };
    if (jinaApiKey) headers['Authorization'] = `Bearer ${jinaApiKey}`;

    const res = await fetch(jinaApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'jina-embeddings-v5-text-small',
        input: [text],
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.data?.[0]?.embedding) {
        return new Float32Array(json.data[0].embedding);
      }
      return null;
    }

    if (!jinaDisableLogged) {
      const body = await res.text().catch(() => '');
      console.warn(`[EMBEDDINGS] Jina API returned ${res.status}. Switching to local ONNX.`, body.slice(0, 200));
      jinaDisableLogged = true;
    }
    jinaDisabled = true;
    return null;
  } catch (err) {
    if (!jinaDisableLogged) {
      console.warn(`[EMBEDDINGS] Jina API fetch error. Switching to local ONNX.`, err?.message ?? err);
      jinaDisableLogged = true;
    }
    jinaDisabled = true;
    return null;
  }
}

export async function computeEmbedding(text, taskType = 'RETRIEVAL_QUERY') {
  if (!text || typeof text !== 'string') return null;

  const sanitized = text.trim().slice(0, 512);
  if (!sanitized) return null;

  const cacheKey = `${taskType}::${sanitized.toLowerCase()}`;
  if (embeddingCache.has(cacheKey)) return embeddingCache.get(cacheKey);
  const jinaVec = await computeJinaEmbedding(sanitized, taskType);
  if (jinaVec) {
    lastProvider = 'jina';
    lruSet(cacheKey, jinaVec);
    return jinaVec;
  }
  try {
    const pipe = await getLocalPipeline();
    if (pipe) {
      const out = await pipe(sanitized, { pooling: 'mean', normalize: true });
      const vec = new Float32Array(out.data);
      lastProvider = 'onnx';
      lruSet(cacheKey, vec);
      return vec;
    }
  } catch (err) {
    console.warn('[EMBEDDINGS] Local ONNX inference failed:', err?.message ?? err);
  }

  return null;
}

export async function computeBatchEmbeddings(texts, taskType = 'RETRIEVAL_DOCUMENT') {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  if (jinaDisabled) {
    return Promise.all(texts.map((t) => computeEmbedding(t, taskType)));
  }

  const results = new Array(texts.length).fill(null);
  const uncachedIndices = [];
  const uncachedTexts = [];

  for (let i = 0; i < texts.length; i++) {
    const sanitized = (texts[i] ?? '').trim().slice(0, 512);
    if (!sanitized) continue;
    const cacheKey = `${taskType}::${sanitized.toLowerCase()}`;
    if (embeddingCache.has(cacheKey)) {
      results[i] = embeddingCache.get(cacheKey);
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(sanitized);
    }
  }

  if (uncachedTexts.length === 0) return results;

  try {
    const CHUNK = 50;
    for (let c = 0; c < uncachedTexts.length; c += CHUNK) {
      const chunkTexts = uncachedTexts.slice(c, c + CHUNK);
      const chunkIndices = uncachedIndices.slice(c, c + CHUNK);

      const jinaApiUrl = process.env.JINA_API_URL || 'https://jina.r1fikri.dev/v1/embeddings';
      const jinaApiKey = process.env.JINA_API_KEY || '';
      const headers = { 'Content-Type': 'application/json' };
      if (jinaApiKey) headers['Authorization'] = `Bearer ${jinaApiKey}`;

      const res = await fetch(jinaApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'jina-embeddings-v5-text-small',
          input: chunkTexts,
        }),
      });

      if (!res.ok) {
        jinaDisabled = true;
        for (let i = 0; i < chunkIndices.length; i++) {
          results[chunkIndices[i]] = await computeEmbedding(chunkTexts[i], taskType);
        }
        continue;
      }

      const json = await res.json();
      (json?.data ?? []).forEach((emb, idx) => {
        if (emb?.embedding) {
          const vec = new Float32Array(emb.embedding);
          results[chunkIndices[idx]] = vec;
          lruSet(`${taskType}::${chunkTexts[idx].toLowerCase()}`, vec);
        }
      });
    }
  } catch (err) {
    console.warn('[EMBEDDINGS] Jina batch failed, using local ONNX for remaining items:', err?.message ?? err);
    jinaDisabled = true;
    for (let i = 0; i < uncachedIndices.length; i++) {
      const originalIdx = uncachedIndices[i];
      if (!results[originalIdx]) {
        results[originalIdx] = await computeEmbedding(uncachedTexts[i], taskType);
      }
    }
  }

  return results;
}

export function calculateSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
