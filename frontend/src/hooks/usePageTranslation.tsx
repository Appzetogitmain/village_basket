import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { translateText } from "../services/translationService";

/**
 * Hook to translate static UI dictionary content.
 * Automatically aggregates and translates all dictionary strings on language changes.
 */
export function usePageTranslation(staticTexts: Record<string, string>, sourceLang: string = "en") {
  const { language } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>(staticTexts);
  const [loading, setLoading] = useState(false);
  
  // Track last used staticTexts to prevent infinite loop re-renders
  const staticTextsRef = useRef(staticTexts);
  useEffect(() => {
    staticTextsRef.current = staticTexts;
  }, [staticTexts]);

  useEffect(() => {
    let active = true;
    const dictionary = staticTextsRef.current;
    
    if (language === sourceLang) {
      setTranslatedTexts(dictionary);
      setLoading(false);
      return;
    }

    async function translateDictionary() {
      setLoading(true);
      try {
        const keys = Object.keys(dictionary);
        const values = Object.values(dictionary);

        // Queue all translations (the translation service will batch them into one HTTP call)
        const promises = values.map((val) => translateText(val, language, sourceLang));
        const translatedValues = await Promise.all(promises);

        if (active) {
          const result: Record<string, string> = {};
          keys.forEach((key, idx) => {
            result[key] = translatedValues[idx];
          });
          setTranslatedTexts(result);
        }
      } catch (err) {
        console.error("Page translation hook failed:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    translateDictionary();

    return () => {
      active = false;
    };
  }, [language, sourceLang]);

  // Synchronous t function to look up keys in the translated texts state
  const t = useCallback(
    (key: string): string => {
      // If key exists, return its translation, otherwise return key itself
      return translatedTexts[key] !== undefined ? translatedTexts[key] : (staticTextsRef.current[key] || key);
    },
    [translatedTexts]
  );

  return { t, loading, translatedTexts };
}
