import { normalizeLanguageCode } from "./languageUtils";

const DB_NAME = "VillageBasketTranslations";
const STORE_NAME = "translations";
const DB_VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
const MAX_LOCAL_STORAGE_ITEMS = 300; // Keep localStorage fallback size in check

interface CacheItem {
  key: string;
  translation: string;
  expiry: number;
}

class TranslationCache {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isLocalStorageFallback = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initDB();
      // Run cleanup on initialization
      setTimeout(() => this.cleanup(), 5000);
    }
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        if (!window.indexedDB) {
          throw new Error("IndexedDB not supported");
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "key" });
          }
        };

        request.onsuccess = (event: any) => {
          resolve(event.target.result);
        };

        request.onerror = (event: any) => {
          console.warn("IndexedDB open error, falling back to localStorage:", event.target.error);
          this.isLocalStorageFallback = true;
          resolve(null as any);
        };
      } catch (err) {
        console.warn("IndexedDB initialization failed, falling back to localStorage:", err);
        this.isLocalStorageFallback = true;
        resolve(null as any);
      }
    });

    return this.dbPromise;
  }

  private getCacheKey(text: string, targetLang: string, sourceLang: string): string {
    const t = text.trim();
    const sl = normalizeLanguageCode(sourceLang);
    const tl = normalizeLanguageCode(targetLang);
    const base64 = btoa(unescape(encodeURIComponent(t))); // safe base64
    return `${sl}_${tl}_${base64}`;
  }

  public async get(text: string, targetLang: string, sourceLang: string = "en"): Promise<string | null> {
    if (!text || text.trim() === "") return null;
    const key = this.getCacheKey(text, targetLang, sourceLang);
    const now = Date.now();

    if (this.isLocalStorageFallback) {
      try {
        const cachedStr = localStorage.getItem(`tr_${key}`);
        if (!cachedStr) return null;
        const item: CacheItem = JSON.parse(cachedStr);
        if (item.expiry < now) {
          localStorage.removeItem(`tr_${key}`);
          return null;
        }
        return item.translation;
      } catch {
        return null;
      }
    }

    try {
      const db = await this.initDB();
      if (!db) return this.getLocalStorageFallback(key);

      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const item: CacheItem = request.result;
          if (item && item.expiry > now) {
            resolve(item.translation);
          } else {
            if (item) {
              // Expired, delete it asynchronously
              this.delete(key);
            }
            resolve(null);
          }
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    } catch {
      return this.getLocalStorageFallback(key);
    }
  }

  private getLocalStorageFallback(key: string): string | null {
    try {
      const cachedStr = localStorage.getItem(`tr_${key}`);
      if (!cachedStr) return null;
      const item: CacheItem = JSON.parse(cachedStr);
      if (item.expiry > Date.now()) {
        return item.translation;
      }
      localStorage.removeItem(`tr_${key}`);
      return null;
    } catch {
      return null;
    }
  }

  public async set(
    text: string,
    targetLang: string,
    sourceLang: string,
    translation: string
  ): Promise<void> {
    if (!text || !translation || text.trim() === "" || translation.trim() === "") return;
    
    // Rule: Never cache translations where translation === original text (indicates API failure or no translation occurred)
    if (text.trim() === translation.trim()) return;

    const key = this.getCacheKey(text, targetLang, sourceLang);
    const expiry = Date.now() + CACHE_TTL;
    const item: CacheItem = { key, translation, expiry };

    if (this.isLocalStorageFallback) {
      this.setLocalStorageFallback(key, item);
      return;
    }

    try {
      const db = await this.initDB();
      if (!db) {
        this.setLocalStorageFallback(key, item);
        return;
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e);
      });
    } catch {
      this.setLocalStorageFallback(key, item);
    }
  }

  private setLocalStorageFallback(key: string, item: CacheItem): void {
    try {
      // Manage localStorage size
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("tr_"));
      if (keys.length > MAX_LOCAL_STORAGE_ITEMS) {
        // Delete oldest items
        const sorted = keys
          .map((k) => {
            try {
              return { k, data: JSON.parse(localStorage.getItem(k)!) };
            } catch {
              return { k, data: { expiry: 0 } };
            }
          })
          .sort((a, b) => a.data.expiry - b.data.expiry);
        
        // Remove 50 oldest items
        for (let i = 0; i < Math.min(50, sorted.length); i++) {
          localStorage.removeItem(sorted[i].k);
        }
      }
      localStorage.setItem(`tr_${key}`, JSON.stringify(item));
    } catch (err) {
      console.warn("localStorage quota exceeded, clearing some translations:", err);
    }
  }

  private async delete(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      if (!db) {
        localStorage.removeItem(`tr_${key}`);
        return;
      }
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.delete(key);
    } catch {
      localStorage.removeItem(`tr_${key}`);
    }
  }

  public async cleanup(): Promise<void> {
    const now = Date.now();

    // 1. Cleanup localStorage
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("tr_")) {
          try {
            const item: CacheItem = JSON.parse(localStorage.getItem(key)!);
            if (item.expiry < now) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
    } catch {}

    // 2. Cleanup IndexedDB
    try {
      const db = await this.initDB();
      if (!db) return;

      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          const item: CacheItem = cursor.value;
          if (item.expiry < now) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch (err) {
      console.warn("IndexedDB cache cleanup error:", err);
    }
  }
}

export const translationCache = new TranslationCache();
