/**
 * Client for Jina Reranker v3 / v3.5 with Cloudflare Access Zero Trust support.
 */

export async function rerankCandidates({
  query,
  documents = [], // array of strings (e.g. formatted book metadata)
  topN = 20,
  timeoutMs = parseInt(process.env.JINA_RERANKER_TIMEOUT_MS, 10) || 2500,
} = {}) {
  const rerankerUrl = process.env.JINA_RERANKER_URL;
  if (!rerankerUrl || !query || documents.length === 0) {
    return null;
  }

  const model = process.env.JINA_RERANKER_MODEL || 'jina-reranker-v3';
  const cfClientId = process.env.CF_ACCESS_CLIENT_ID || process.env.JINA_CF_CLIENT_ID || '';
  const cfClientSecret = process.env.CF_ACCESS_CLIENT_SECRET || process.env.JINA_CF_CLIENT_SECRET || '';
  const apiKey = process.env.JINA_RERANKER_API_KEY || process.env.JINA_API_KEY || '';

  const headers = {
    'Content-Type': 'application/json',
  };

  // Support Cloudflare Access Service Token
  if (cfClientId && cfClientSecret) {
    headers['CF-Access-Client-Id'] = cfClientId;
    headers['CF-Access-Client-Secret'] = cfClientSecret;
  }

  // Support standard Bearer token if provided
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const payload = {
      model,
      query,
      top_n: Math.min(topN, documents.length),
      documents,
    };

    const res = await fetch(rerankerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[RERANKER] HTTP ${res.status} from ${rerankerUrl}:`, errText.slice(0, 200));
      return null;
    }

    const json = await res.json();
    const rawResults = json.results || json.data || [];

    // Map results: [{ index: 0, relevance_score: 0.95 }, ...]
    const ranked = rawResults.map((r) => ({
      index: typeof r.index === 'number' ? r.index : r.document?.index ?? 0,
      score: typeof r.relevance_score === 'number' ? r.relevance_score : (r.score ?? 0),
    }));

    return ranked;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[RERANKER] Request timed out after ${timeoutMs}ms. Falling back to Stage-1 ranking.`);
    } else {
      console.warn('[RERANKER] Fetch failed, falling back to Stage-1 ranking:', err.message || err);
    }
    return null;
  }
}
