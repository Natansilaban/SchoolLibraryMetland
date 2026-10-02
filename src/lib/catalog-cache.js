// In-memory server cache for catalog searches and browse listings
// Eliminates remote Tailscale database latency for repeated catalog views

const cache = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

export function getCachedCatalog(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

export function setCachedCatalog(key, data, ttlMs = DEFAULT_TTL_MS) {
  // Cap cache size at 100 items to prevent any memory growth
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
}

export function invalidateCatalogCache() {
  cache.clear();
}
