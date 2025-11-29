export function getCache<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function invalidateCache(key: string): void {
  localStorage.removeItem(key);
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
