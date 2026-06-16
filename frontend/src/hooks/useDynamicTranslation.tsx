import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { translateText } from "../services/translationService";

/**
 * Hook to translate dynamic backend content (like product names, descriptions)
 * in real-time as language changes.
 */
export function useDynamicTranslation(text: string, sourceLang: string = "en") {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (!text || text.trim() === "") {
      setTranslatedText("");
      return;
    }

    if (language === sourceLang) {
      setTranslatedText(text);
      return;
    }

    async function performTranslation() {
      setLoading(true);
      try {
        const result = await translateText(text, language, sourceLang);
        if (active) {
          setTranslatedText(result);
        }
      } catch (err) {
        console.error("Dynamic translation hook error:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    performTranslation();

    return () => {
      active = false;
    };
  }, [text, language, sourceLang]);

  return { translatedText, loading };
}
