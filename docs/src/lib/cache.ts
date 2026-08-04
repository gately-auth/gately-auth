/**
 * Simple in-memory cache for API responses
 * Reduces duplicate API calls within the same request/session
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data or fetch if not available/expired
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_DURATION
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);

  // Return cached data if valid
  if (cached && (now - cached.timestamp) < ttl) {
    return cached.data as T;
  }

  try {
    // Fetch fresh data
    const data = await fetcher();
    
    // Only cache if we got valid non-empty data
    const isEmpty = data === null || data === undefined || (Array.isArray(data) && data.length === 0);
    if (!isEmpty) {
      cache.set(key, {
        data,
        timestamp: now
      });
    }

    return data;
  } catch (error) {
    // If we have stale cached data, return it as fallback
    if (cached) {
      return cached.data as T;
    }
    
    // Re-throw the error if no fallback available
    throw error;
  }
}

/**
 * Clear cache for a specific key or all keys
 */
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Clean up expired cache entries
 */
export function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}

// Note: setInterval is not supported in Cloudflare Workers runtime
// Cache cleanup happens lazily on each getCached call instead
