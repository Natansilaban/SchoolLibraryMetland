/**
 * Semantic Embedding Service
 *
 * Primary: Google Gemini API (gemini-embedding-001 or text-embedding-004)
 * Fallback: Local ONNX via @huggingface/transformers (ONNX Runtime Web — @xenova/transformers is deprecated)
 *
 * Key design decisions:
 * - Gemini 429 (rate limit) throws and causes lexical fallback in catalog-search. It does NOT
 *   silently fall through to local ONNX, which would mix 768-dim and 384-dim vectors and corrupt scores.
 * - All other Gemini errors (404, 5xx, network) do fall back to local ONNX, and the same model
 *   is used for both query and document embeddings, keeping the vector space consistent.
 * - The in-process LRU cache keeps repeated queries fast without persisting to disk.
 */

const embeddingCache = new Map();
const MAX_CACHE_SIZE = 3000;

/** @type {any} */
let localPipeline = null;
let localInitPromise = null;

// Which Gemini model is currently working (avoids repeated 404 retries after model deprecation)
let activeGeminiModel = 'gemini-embedding-001';
// When true, all Gemini calls are skipped for this server session (404/5xx, not 429)
let geminiDisabled = false;
// Flag to log the disable event once
let geminiDisableLogged = false;

function lruSet(key, value) {
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    embeddingCache.delete(embeddingCache.keys().next().value);
  }
  embeddingCache.set(key, value);
}

/**
 * Lazy-loads the local fallback model once.
 * Uses @huggingface/transformers (ONNX Runtime Web) — @xenova/transformers is deprecated.
 */
async function getLocalPipeline() {
  if (localPipeline) return localPipeline;
  if (localInitPromise) return localInitPromise;

  localInitPromise = (async () => {
    try {
      // @huggingface/transformers is the maintained successor to @xenova/transformers
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

/**
 * Computes a single normalized embedding via Gemini API.
 * Throws on 429 so the caller can propagate rate-limit errors without silently mixing vector spaces.
 * Returns null on 404/5xx/network errors (caller falls back to local ONNX).
 *
 * @param {string} text
 * @param {'RETRIEVAL_QUERY'|'RETRIEVAL_DOCUMENT'} taskType
 * @returns {Promise<Float32Array|null>}
 */
async function computeGeminiEmbedding(text, taskType) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || geminiDisabled) return null;

  const models = [
    activeGeminiModel,
    activeGeminiModel === 'gemini-embedding-001' ? 'text-embedding-004' : 'gemini-embedding-001',
  ];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: `models/${model}`,
            content: { parts: [{ text }] },
            taskType,
            outputDimensionality: 768,
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        if (json?.embedding?.values) {
          activeGeminiModel = model;
          return new Float32Array(json.embedding.values);
        }
        return null;
      }

      if (res.status === 429) {
        throw new Error('GEMINI_RATE_LIMIT');
      }

      if (res.status === 404) {
        // Try the other model
        continue;
      }

      // 5xx or other non-retryable error — disable Gemini for the session
      if (!geminiDisableLogged) {
        const body = await res.text().catch(() => '');
        console.warn(`[EMBEDDINGS] Gemini ${model} returned ${res.status}. Switching to local ONNX.`, body.slice(0, 200));
        geminiDisableLogged = true;
      }
      geminiDisabled = true;
      return null;
    } catch (err) {
      if (err.message === 'GEMINI_RATE_LIMIT') throw err;
      if (!geminiDisableLogged) {
        console.warn(`[EMBEDDINGS] Gemini ${model} fetch error. Switching to local ONNX.`, err?.message ?? err);
        geminiDisableLogged = true;
      }
      geminiDisabled = true;
      return null;
    }
  }

  // Both models 404'd — disable for session
  geminiDisabled = true;
  return null;
}

/**
 * Computes a normalized embedding for a single string.
 * Uses Gemini when available, local ONNX as fallback.
 * Throws GEMINI_RATE_LIMIT errors so callers can gate on them without mixing vector spaces.
 *
 * @param {string} text
 * @param {'RETRIEVAL_QUERY'|'RETRIEVAL_DOCUMENT'} [taskType='RETRIEVAL_QUERY']
 * @returns {Promise<Float32Array|null>}
 */
export async function computeEmbedding(text, taskType = 'RETRIEVAL_QUERY') {
  if (!text || typeof text !== 'string') return null;

  const sanitized = text.trim().slice(0, 512);
  if (!sanitized) return null;

  const cacheKey = `${taskType}::${sanitized.toLowerCase()}`;
  if (embeddingCache.has(cacheKey)) return embeddingCache.get(cacheKey);

  // Try Gemini first
  const geminiVec = await computeGeminiEmbedding(sanitized, taskType);
  if (geminiVec) {
    lruSet(cacheKey, geminiVec);
    return geminiVec;
  }

  // Local ONNX fallback (only if Gemini did NOT throw 429 — that error propagates up)
  try {
    const pipe = await getLocalPipeline();
    if (pipe) {
      const out = await pipe(sanitized, { pooling: 'mean', normalize: true });
      const vec = new Float32Array(out.data);
      lruSet(cacheKey, vec);
      return vec;
    }
  } catch (err) {
    console.warn('[EMBEDDINGS] Local ONNX inference failed:', err?.message ?? err);
  }

  return null;
}

/**
 * Batch embedding via Gemini batchEmbedContents. Falls back to sequential computeEmbedding calls
 * if Gemini is unavailable so the same model is always used for the whole batch.
 * Throws GEMINI_RATE_LIMIT if rate-limited.
 *
 * @param {string[]} texts
 * @param {'RETRIEVAL_DOCUMENT'|'RETRIEVAL_QUERY'} [taskType='RETRIEVAL_DOCUMENT']
 * @returns {Promise<Array<Float32Array|null>>}
 */
export async function computeBatchEmbeddings(texts, taskType = 'RETRIEVAL_DOCUMENT') {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const key = process.env.GEMINI_API_KEY;

  // No key or Gemini disabled — use local model sequentially for whole batch
  if (!key || geminiDisabled) {
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

  // Try Gemini batch endpoint
  try {
    const CHUNK = 50;
    for (let c = 0; c < uncachedTexts.length; c += CHUNK) {
      const chunkTexts = uncachedTexts.slice(c, c + CHUNK);
      const chunkIndices = uncachedIndices.slice(c, c + CHUNK);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${activeGeminiModel}:batchEmbedContents?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: chunkTexts.map((text) => ({
              model: `models/${activeGeminiModel}`,
              content: { parts: [{ text }] },
              taskType,
              outputDimensionality: 768,
            })),
          }),
        }
      );

      if (res.status === 429) {
        throw new Error('GEMINI_RATE_LIMIT');
      }

      if (!res.ok) {
        // Non-429 error — disable Gemini and process remaining chunks with local ONNX
        geminiDisabled = true;
        for (let i = 0; i < chunkIndices.length; i++) {
          results[chunkIndices[i]] = await computeEmbedding(chunkTexts[i], taskType);
        }
        continue;
      }

      const json = await res.json();
      (json?.embeddings ?? []).forEach((emb, idx) => {
        if (emb?.values) {
          const vec = new Float32Array(emb.values);
          results[chunkIndices[idx]] = vec;
          lruSet(`${taskType}::${chunkTexts[idx].toLowerCase()}`, vec);
        }
      });
    }
  } catch (err) {
    if (err.message === 'GEMINI_RATE_LIMIT') throw err;

    // Network or parse error — process remaining nulls with local ONNX
    console.warn('[EMBEDDINGS] Gemini batch failed, using local ONNX for remaining items:', err?.message ?? err);
    geminiDisabled = true;
    for (let i = 0; i < uncachedIndices.length; i++) {
      const originalIdx = uncachedIndices[i];
      if (!results[originalIdx]) {
        results[originalIdx] = await computeEmbedding(uncachedTexts[i], taskType);
      }
    }
  }

  return results;
}

/**
 * Cosine similarity between two normalized vectors.
 * Returns 0 when vectors have mismatched dimensions or are empty (guards against mixed model spaces).
 *
 * @param {Float32Array|number[]} vecA
 * @param {Float32Array|number[]} vecB
 * @returns {number}
 */
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
