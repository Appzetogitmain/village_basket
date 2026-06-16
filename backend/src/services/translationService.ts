import axios from "axios";
import { translateClient, getLanguageCode } from "../config/googleCloud";

interface CacheEntry {
  translation: string;
  expiry: number;
}

// In-memory cache
const cacheStore = new Map<string, CacheEntry>();

// Cache TTL: 24 hours in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Cleanup expired cache items every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cacheStore.entries()) {
    if (value.expiry < now) {
      cacheStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Generates a cache key based on source, target and base64 of text
 */
function getCacheKey(text: string, targetLang: string, sourceLang: string = "en"): string {
  const normalizedText = text.trim();
  const base64Text = Buffer.from(normalizedText).toString("base64");
  return `${sourceLang}_${targetLang}_${base64Text}`;
}

/**
 * Helper to delay execution (used for backoff)
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Free translation fallback using Google's public translation endpoint
 */
async function translateFree(text: string, targetLang: string, sourceLang: string = "auto"): Promise<string> {
  const sl = getLanguageCode(sourceLang);
  const tl = getLanguageCode(targetLang);

  if (!text || text.trim() === "") return "";
  if (sl === tl) return text;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await axios.get(url, { timeout: 5000 });
    if (response.data && response.data[0] && response.data[0][0] && response.data[0][0][0]) {
      return response.data[0][0][0];
    }
    throw new Error("Invalid response from free translation API");
  } catch (error: any) {
    console.error("Free translation fallback failed:", error.message || error);
    throw error;
  }
}

/**
 * Translates a single string with retry logic and caching
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "en"
): Promise<string> {
  if (!text || text.trim() === "") return "";
  
  const targetCode = getLanguageCode(targetLang);
  const sourceCode = getLanguageCode(sourceLang);
  
  if (targetCode === sourceCode) return text;

  const cacheKey = getCacheKey(text, targetCode, sourceCode);
  const cached = cacheStore.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiry > now) {
    return cached.translation;
  }

  let lastError: any = null;
  const retries = 3;
  const delays = [1000, 2000, 4000];

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let result = "";
      if (translateClient) {
        // Use Google Cloud Translate v2
        const [translation] = await translateClient.translate(text, {
          from: sourceCode,
          to: targetCode,
        });
        result = translation;
      } else {
        // Fallback to free API
        result = await translateFree(text, targetCode, sourceCode);
      }

      // Check if translation is valid and doesn't equal original text on API failure (if applicable)
      if (result && result.trim() !== "") {
        // Store in cache only if translation !== original (or if source was different and they genuinely translated)
        if (result !== text || sourceCode === "auto") {
          cacheStore.set(cacheKey, {
            translation: result,
            expiry: Date.now() + CACHE_TTL,
          });
        }
        return result;
      }
      throw new Error("Empty translation result received");
    } catch (err: any) {
      lastError = err;
      console.warn(`Translation attempt ${attempt + 1} failed for text: "${text.substring(0, 20)}...". Error: ${err.message || err}`);
      if (attempt < retries) {
        await delay(delays[attempt]);
      }
    }
  }

  // Fallback to original text on failure
  console.error(`All translation attempts failed. Falling back to original text. Error:`, lastError);
  return text;
}

/**
 * Translates a batch of texts in parallel
 */
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang: string = "en"
): Promise<string[]> {
  if (!texts || texts.length === 0) return [];
  
  // Translate all items in parallel (with caching handled per item)
  const promises = texts.map((text) => translateText(text, targetLang, sourceLang));
  return Promise.all(promises);
}

/**
 * Recursively translates specific keys inside an object/array
 */
export async function translateObject(
  obj: any,
  targetLang: string,
  sourceLang: string = "en",
  keysToTranslate: string[] = []
): Promise<any> {
  if (!obj) return obj;

  if (Array.isArray(obj)) {
    return Promise.all(
      obj.map((item) => translateObject(item, targetLang, sourceLang, keysToTranslate))
    );
  }

  if (typeof obj === "object") {
    const translatedObj = { ...obj };
    const promises: Promise<any>[] = [];
    const keys: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && keysToTranslate.includes(key)) {
        keys.push(key);
        promises.push(translateText(value, targetLang, sourceLang));
      } else if (typeof value === "object" && value !== null) {
        keys.push(key);
        promises.push(translateObject(value, targetLang, sourceLang, keysToTranslate));
      }
    }

    const results = await Promise.all(promises);
    for (let i = 0; i < keys.length; i++) {
      translatedObj[keys[i]] = results[i];
    }
    return translatedObj;
  }

  return obj;
}
