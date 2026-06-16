import api from "./api/config";
import { translationCache } from "../utils/translationCache";
import { normalizeLanguageCode } from "../utils/languageUtils";

interface QueuedRequest {
  text: string;
  resolve: (value: string) => void;
  reject: (err: any) => void;
}

// Map key: `${sourceLang}_${targetLang}`, Value: Array of queued requests
const queues = new Map<string, QueuedRequest[]>();
const timers = new Map<string, NodeJS.Timeout>();

const BATCH_SIZE_LIMIT = 10;
const BATCH_WINDOW_MS = 100; // 100ms window to accumulate requests
const MIN_REQUEST_INTERVAL_MS = 200; // Rate limit spacing

let lastRequestTime = 0;

/**
 * Throttles/delays executions to maintain a minimum interval between requests
 */
async function rateLimitSpacing(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
    const delayTime = MIN_REQUEST_INTERVAL_MS - timeSinceLast;
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }
  lastRequestTime = Date.now();
}

/**
 * Triggers processing for a specific language pair queue
 */
function processQueue(sourceLang: string, targetLang: string) {
  const queueKey = `${sourceLang}_${targetLang}`;
  const queue = queues.get(queueKey) || [];
  
  if (queue.length === 0) return;

  // Clear timer
  if (timers.has(queueKey)) {
    clearTimeout(timers.get(queueKey)!);
    timers.delete(queueKey);
  }

  // Slice off up to BATCH_SIZE_LIMIT requests to translate
  const batchToTranslate = queue.slice(0, BATCH_SIZE_LIMIT);
  queues.set(queueKey, queue.slice(BATCH_SIZE_LIMIT));

  // Run the batch translation
  executeBatchTranslation(batchToTranslate, targetLang, sourceLang);

  // If there are still items in the queue, schedule the next batch
  if (queue.length > BATCH_SIZE_LIMIT) {
    const timer = setTimeout(() => processQueue(sourceLang, targetLang), BATCH_WINDOW_MS);
    timers.set(queueKey, timer);
  }
}

/**
 * Calls the backend API to translate a batch of texts
 */
async function executeBatchTranslation(
  requests: QueuedRequest[],
  targetLang: string,
  sourceLang: string
) {
  const texts = requests.map((r) => r.text);
  
  try {
    await rateLimitSpacing();
    
    const response = await api.post("/translate/batch", {
      texts,
      targetLang,
      sourceLang,
    });

    if (response.data && response.data.success && response.data.data?.translations) {
      const translations: string[] = response.data.data.translations;
      
      // Resolve each request and cache the result
      requests.forEach((req, idx) => {
        const translation = translations[idx] || req.text;
        
        // Cache the translation
        translationCache.set(req.text, targetLang, sourceLang, translation);
        
        // Resolve the promise
        req.resolve(translation);
      });
    } else {
      throw new Error("Translation batch response invalid");
    }
  } catch (error: any) {
    console.error("Batch translation API error:", error.message || error);
    
    // Fallback: resolve all with their original text
    requests.forEach((req) => {
      req.resolve(req.text);
    });
  }
}

/**
 * Translates a single text. First checks cache, then queues for batch processing.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "en"
): Promise<string> {
  if (!text || text.trim() === "") return "";
  
  const sl = normalizeLanguageCode(sourceLang);
  const tl = normalizeLanguageCode(targetLang);
  
  if (sl === tl) return text;

  // 1. Check cache first
  const cachedVal = await translationCache.get(text, tl, sl);
  if (cachedVal !== null) {
    return cachedVal;
  }

  // 2. Queue for batching
  return new Promise<string>((resolve, reject) => {
    const queueKey = `${sl}_${tl}`;
    if (!queues.has(queueKey)) {
      queues.set(queueKey, []);
    }
    
    const queue = queues.get(queueKey)!;
    
    // Avoid queueing exact duplicate texts twice in the same batch
    const duplicate = queue.find((r) => r.text === text);
    if (duplicate) {
      // Chain onto the existing duplicate's promise resolution
      const originalResolve = duplicate.resolve;
      duplicate.resolve = (val: string) => {
        originalResolve(val);
        resolve(val);
      };
      return;
    }

    queue.push({ text, resolve, reject });

    // If batch size is reached, process immediately
    if (queue.length >= BATCH_SIZE_LIMIT) {
      processQueue(sl, tl);
    } else {
      // Otherwise reset/schedule debounced processing
      if (timers.has(queueKey)) {
        clearTimeout(timers.get(queueKey)!);
      }
      const timer = setTimeout(() => processQueue(sl, tl), BATCH_WINDOW_MS);
      timers.set(queueKey, timer);
    }
  });
}

/**
 * Translates an array of texts in batch (uses queue under the hood for cache/dedup benefits)
 */
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang: string = "en"
): Promise<string[]> {
  if (!texts || texts.length === 0) return [];
  const promises = texts.map((t) => translateText(t, targetLang, sourceLang));
  return Promise.all(promises);
}

/**
 * Recursively translates selected keys in an object or array of objects via the backend
 */
export async function translateObject(
  obj: any,
  targetLang: string,
  sourceLang: string = "en",
  keysToTranslate: string[] = []
): Promise<any> {
  if (!obj) return obj;
  const sl = normalizeLanguageCode(sourceLang);
  const tl = normalizeLanguageCode(targetLang);

  if (sl === tl) return obj;

  try {
    const response = await api.post("/translate/object", {
      obj,
      targetLang: tl,
      sourceLang: sl,
      keysToTranslate,
    });

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error("Invalid response format for translateObject");
  } catch (error: any) {
    console.error("translateObject failed, returning original object:", error.message || error);
    return obj;
  }
}
