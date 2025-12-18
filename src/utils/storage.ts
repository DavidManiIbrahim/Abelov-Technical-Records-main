/**
 * Storage Utilities
 * Includes both persistent storage (localStorage) and memory cache utilities
 */

// Memory cache utilities (original implementation)
// Persistent cache utilities (localStorage implementation)
const CACHE_PREFIX = 'abelov_api_cache_';
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

export function getCache<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return null;

    const data = JSON.parse(item);
    if (data.expiry && Date.now() > data.expiry) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return data.value;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, value: T, ttl: number = DEFAULT_TTL): void {
  try {
    const data = {
      value,
      expiry: Date.now() + ttl,
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to persistent cache', err);
  }
}

export function invalidateCache(key: string): void {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    // Also invalidate partial matches for lists (simple approximation)
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(`${CACHE_PREFIX}${key}`)) {
        localStorage.removeItem(k);
      }
    });
  } catch {
    // ignore
  }
}

/**
 * Persistent Storage Utility
 * Provides type-safe localStorage operations with error handling
 */

export interface StorageOptions {
  prefix?: string;
  ttl?: number; // Time to live in milliseconds
}

class PersistentStorage {
  private prefix: string;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'abelov_';
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Store data in localStorage with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(this.getKey(key), JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }

  /**
   * Retrieve data from localStorage with TTL check
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return defaultValue;

      const data = JSON.parse(item);

      // Check TTL if specified
      if (data.ttl && data.timestamp) {
        const age = Date.now() - data.timestamp;
        if (age > data.ttl) {
          this.remove(key); // Remove expired item
          return defaultValue;
        }
      }

      return data.value;
    } catch (error) {
      console.warn(`Failed to retrieve ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove data from localStorage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  }

  /**
   * Clear all data with the current prefix
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  /**
   * Check if data exists and is not expired
   */
  has(key: string): boolean {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return false;

      const data = JSON.parse(item);

      // Check TTL if specified
      if (data.ttl && data.timestamp) {
        const age = Date.now() - data.timestamp;
        if (age > data.ttl) {
          this.remove(key); // Remove expired item
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Create instances for different data types
export const appStorage = new PersistentStorage({ prefix: 'abelov_app_' });
export const userStorage = new PersistentStorage({ prefix: 'abelov_user_' });
export const formStorage = new PersistentStorage({ prefix: 'abelov_form_' });

// Utility functions for common operations
export const persistentState = {
  // Form persistence utilities
  saveFormState: <T>(formId: string, state: T) => {
    formStorage.set(`form_${formId}`, state, 24 * 60 * 60 * 1000); // 24 hours TTL
  },

  loadFormState: <T>(formId: string, defaultState?: T): T | undefined => {
    return formStorage.get(`form_${formId}`, defaultState);
  },

  clearFormState: (formId: string) => {
    formStorage.remove(`form_${formId}`);
  },

  // User preferences
  saveUserPreference: <T>(key: string, value: T) => {
    userStorage.set(`pref_${key}`, value);
  },

  loadUserPreference: <T>(key: string, defaultValue?: T): T | undefined => {
    return userStorage.get(`pref_${key}`, defaultValue);
  },

  // App state (non-user specific)
  saveAppState: <T>(key: string, value: T, ttl?: number) => {
    appStorage.set(key, value, ttl);
  },

  loadAppState: <T>(key: string, defaultValue?: T): T | undefined => {
    return appStorage.get(key, defaultValue);
  },

  // Clear all user data (for logout)
  clearUserData: () => {
    userStorage.clear();
    formStorage.clear();
  },

  // Clear all app data
  clearAllData: () => {
    appStorage.clear();
    userStorage.clear();
    formStorage.clear();
  },
};

export default persistentState;