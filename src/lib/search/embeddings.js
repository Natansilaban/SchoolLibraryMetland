/**
 * Semantic Embedding Service
 * Powered by Google Gemini (text-embedding-004) with local cosine similarity
 * and graceful fallback.
 */

const embeddingCache = new Map();
const MAX_CACHE_SIZE = 2000;

let localExtractor = null;
let isInitializingLocal = null;
let warnedApiKey = false;

function cacheVector(key, vector) {
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = embeddingCache.keys().next().value;
    embeddingCache.delete(oldestKey);
  }
  embeddingCache.set(key, vector);
}

/**
 * Lazy initializer for fallback local ONNX model (only used if GEMINI_API_KEY is not set)
 */
async function getLocalExtractor() {
  if (localExtractor) return localExtractor;
  if (!isInitializingLocal) {
    isInitializingLocal = (async () => {
      try {
        const { pipeline } = await import('@xenova/transformers');
        localExtractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', {
          quantized: true,
        });
        return localExtractor;
      } catch (err) {
        return null;
      } finally {
        isInitializingLocal = null;
      }
    })();
  }
  return await isInitializingLocal;
}

/**
 * Computes a normalized vector embedding for text using Google Gemini text-embedding-004.
 * @param {string} text - Raw input string
 * @returns {Promise<Float32Array|null>}
 */
export async function computeEmbedding(text) {
  if (!text || typeof text !== 'string') return null;

  const sanitized = text.trim().slice(0, 500);
  if (!sanitized) return null;

  const cacheKey = sanitized.toLowerCase();
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: sanitized }] },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        if (json?.embedding?.values) {
          const vector = new Float32Array(json.embedding.values);
          cacheVector(cacheKey, vector);
          return vector;
        }
      } else {
        const errBody = await res.text();
        console.warn('[GEMINI EMBEDDINGS] API response warning:', res.status, errBody);
      }
    } catch (err) {
      console.warn('[GEMINI EMBEDDINGS] Request error:', err.message || err);
    }
  } else if (!warnedApiKey) {
    console.info('[SEARCH] Info: GEMINI_API_KEY is not set. Set GEMINI_API_KEY for cloud Gemini AI semantic search.');
    warnedApiKey = true;
  }

  // Graceful local fallback if Gemini key is absent
  try {
    const extractor = await getLocalExtractor();
    if (extractor) {
      const output = await extractor(sanitized, { pooling: 'mean', normalize: true });
      const vector = new Float32Array(output.data);
      cacheVector(cacheKey, vector);
      return vector;
    }
  } catch {
    // Ignore non-fatal local error; catalog search falls back to lexical
  }

  return null;
}

/**
 * Computes embeddings in batch for high-speed candidate ranking using Gemini batchEmbedContents.
 * @param {string[]} texts
 * @returns {Promise<Array<Float32Array|null>>}
 */
export async function computeBatchEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return Promise.all(texts.map((t) => computeEmbedding(t)));
  }

  const results = new Array(texts.length).fill(null);
  const uncachedIndices = [];
  const uncachedTexts = [];

  for (let i = 0; i < texts.length; i++) {
    const sanitized = (texts[i] || '').trim().slice(0, 500);
    const cacheKey = sanitized.toLowerCase();
    if (sanitized && embeddingCache.has(cacheKey)) {
      results[i] = embeddingCache.get(cacheKey);
    } else if (sanitized) {
      uncachedIndices.push(i);
      uncachedTexts.push(sanitized);
    }
  }

  if (uncachedTexts.length === 0) return results;

  try {
    const CHUNK_SIZE = 50;
    for (let c = 0; c < uncachedTexts.length; c += CHUNK_SIZE) {
      const chunkTexts = uncachedTexts.slice(c, c + CHUNK_SIZE);
      const chunkIndices = uncachedIndices.slice(c, c + CHUNK_SIZE);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: chunkTexts.map((text) => ({
              model: 'models/text-embedding-004',
              content: { parts: [{ text }] },
            })),
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const embeddings = json?.embeddings || [];
        embeddings.forEach((emb, idx) => {
          if (emb?.values) {
            const vec = new Float32Array(emb.values);
            const originalIdx = chunkIndices[idx];
            results[originalIdx] = vec;
            cacheVector(chunkTexts[idx].toLowerCase(), vec);
          }
        });
      } else {
        // Fallback for this chunk
        for (let idx = 0; idx < chunkIndices.length; idx++) {
          const originalIdx = chunkIndices[idx];
          results[originalIdx] = await computeEmbedding(chunkTexts[idx]);
        }
      }
    }
  } catch (err) {
    console.warn('[GEMINI BATCH] Batch error, falling back:', err.message);
    for (let idx = 0; idx < uncachedIndices.length; idx++) {
      const originalIdx = uncachedIndices[idx];
      if (!results[originalIdx]) {
        results[originalIdx] = await computeEmbedding(uncachedTexts[idx]);
      }
    }
  }

  return results;
}

/**
 * Calculates cosine similarity between two vector embeddings.
 * @param {Float32Array|Array<number>} vecA
 * @param {Float32Array|Array<number>} vecB
 * @returns {number} Value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized text)
 */
export function calculateSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
