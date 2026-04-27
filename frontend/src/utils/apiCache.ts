/**
 * Simple in-memory cache for API responses
 * Helps prevent duplicate requests and speeds up repeated calls
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * Get cached data or fetch if not cached/expired
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
    persist: boolean = false
  ): Promise<T> {
    // Check if there's a pending request for this key (deduplication)
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Check memory cache first (fast path)
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data as T;
    }

    // Only check sessionStorage if persist is enabled AND memory cache missed
    if (persist && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(`api_cache_${key}`);
        if (stored) {
          const entry = JSON.parse(stored);
          if (Date.now() < entry.expiresAt) {
            this.cache.set(key, entry); // Hydrate memory cache
            return entry.data as T;
          } else {
            sessionStorage.removeItem(`api_cache_${key}`);
          }
        }
      } catch (e) {
        // Ignore storage errors
      }
    }

    // Fetch new data
    const requestPromise = fetchFn().then((data) => {
      const entry = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      
      this.cache.set(key, entry);

      if (persist && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(`api_cache_${key}`, JSON.stringify(entry));
        } catch (e) {
          console.error('Failed to save to sessionStorage', e);
        }
      }

      this.pendingRequests.delete(key);
      return data;
    }).catch((error) => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`api_cache_${key}`);
    }
  }

  /**
   * Invalidate cache matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
      }
    }
    
    // Also check sessionStorage
    if (typeof window !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('api_cache_')) {
          const cacheKey = key.replace('api_cache_', '');
          if (regex.test(cacheKey)) {
            sessionStorage.removeItem(key);
          }
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    if (typeof window !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('api_cache_')) {
          sessionStorage.removeItem(key!);
          i--; // Adjust index after removal
        }
      }
    }
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.invalidate(key);
      }
    }
  }

  /**
   * Check if data is cached and not expired (synchronous)
   */
  has(key: string): boolean {
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      return cached !== undefined && Date.now() < cached.expiresAt;
    }
    
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`api_cache_${key}`);
      if (stored) {
        const entry = JSON.parse(stored);
        return Date.now() < entry.expiresAt;
      }
    }
    
    return false;
  }

  /**
   * Get cached data synchronously (returns null if not cached or expired)
   */
  getSync<T>(key: string): T | null {
    // Check memory first
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data as T;
    }

    // Check storage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`api_cache_${key}`);
      if (stored) {
        const entry = JSON.parse(stored);
        if (Date.now() < entry.expiresAt) {
          return entry.data as T;
        }
      }
    }
    
    return null;
  }
}

// Singleton instance
export const apiCache = new APICache();

// Clean expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanExpired();
  }, 60 * 1000);
}

