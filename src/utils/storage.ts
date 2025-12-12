/**
 * Storage utility - CACHE ONLY
 * 
 * Rules:
 * 1. Only cache data AFTER successful DB operations
 * 2. Never use localStorage for auth tokens or user identity
 * 3. Cached data is non-critical and can be cleared anytime
 * 4. Always fetch fresh from server when needed
 */

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Fail silently if localStorage is full or unavailable
    console.warn(`Failed to cache ${key}`);
  }
}

export function invalidateCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Fail silently
  }
}

export async function getOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }
  const data = await fetchFn();
  setCache(key, data);
  return data;
}

/**
 * Clear all non-critical cache (safe to call anytime)
 * Preserves nothing; all state comes from server on next fetch
 */
export function clearAllCache(): void {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    // Only clear app cache keys, not system keys
    if (key.startsWith('requests:') || key.startsWith('service_request:') || 
        key.startsWith('search:') || key.startsWith('status:') || 
        key.startsWith('stats:')) {
      localStorage.removeItem(key);
    }
  });
}

