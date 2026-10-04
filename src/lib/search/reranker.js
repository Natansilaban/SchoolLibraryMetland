let _rerankerConfig = null;

function getRerankerConfig() {
  if (_rerankerConfig) return _rerankerConfig;

  const rerankerUrl = process.env.JINA_RERANKER_URL;
  const model = process.env.JINA_RERANKER_MODEL;
  
  if (!rerankerUrl || !model) return null;

  const cfClientId = process.env.CF_ACCESS_CLIENT_ID || process.env.JINA_CF_CLIENT_ID || '';
  const cfClientSecret = process.env.CF_ACCESS_CLIENT_SECRET || process.env.JINA_CF_CLIENT_SECRET || '';
  const apiKey = process.env.JINA_RERANKER_API_KEY || process.env.JINA_API_KEY || '';

  const headers = {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
  };

  if (cfClientId && cfClientSecret) {
    headers['CF-Access-Client-Id'] = cfClientId;
    headers['CF-Access-Client-Secret'] = cfClientSecret;
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  _rerankerConfig = { rerankerUrl, model, headers };
  return _rerankerConfig;
}

export async function rerankCandidates({
  query,
  documents = [],
  topN = 20,
  timeoutMs = parseInt(process.env.JINA_RERANKER_TIMEOUT_MS, 10) || 2500,
} = {}) {
  const cfg = getRerankerConfig();
  if (!cfg || !query || documents.length === 0) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const payload = {
      model: cfg.model,
      query,
      top_n: Math.min(topN, documents.length),
      documents,
    };

    const res = await fetch(cfg.rerankerUrl, {
      method: 'POST',
      headers: cfg.headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[RERANKER] HTTP ${res.status} from ${cfg.rerankerUrl}:`, errText.slice(0, 200));
      return null;
    }

    const json = await res.json();
    const rawResults = json.results || json.data || [];

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
