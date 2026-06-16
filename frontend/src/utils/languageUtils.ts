export const languageCodeMap: Record<string, string> = {
  en: "en",
  hi: "hi",
  mr: "mr",
  te: "te",
  ta: "ta",
  kn: "kn",
};

export const RTL_LANGUAGES = ["ar", "he", "ur", "fa"];

/**
 * Normalizes language/locale codes into supported translation API codes
 * Example: 'en-US' -> 'en', 'hi-IN' -> 'hi'
 */
export function normalizeLanguageCode(code: string): string {
  if (!code) return "en";
  const base = code.split("-")[0].toLowerCase();
  return languageCodeMap[base] || "en";
}

/**
 * Checks if a language code requires RTL layout direction
 */
export function isRTL(code: string): boolean {
  const normalized = normalizeLanguageCode(code);
  return RTL_LANGUAGES.includes(normalized);
}
