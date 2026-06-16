import React, { createContext, useContext, useState, useEffect } from "react";
import { normalizeLanguageCode, isRTL } from "../utils/languageUtils";
import { translateText } from "../services/translationService";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Module-level WeakMaps to cache original values and prevent redundant translations or loops
const originalTexts = new WeakMap<Text, string>();
const translatedTexts = new WeakMap<Text, string>();
const originalPlaceholders = new WeakMap<Element, string>();
const translatedPlaceholders = new WeakMap<Element, string>();
const originalTitles = new WeakMap<Element, string>();
const translatedTitles = new WeakMap<Element, string>();

const getCurrentLanguageKey = (): string => {
  try {
    const dataStr = localStorage.getItem("userData");
    if (dataStr) {
      const data = JSON.parse(dataStr);
      const userId = data?.id || data?._id;
      if (userId) {
        return `user_app_language_${userId}`;
      }
    }
  } catch (e) {
    // ignore
  }
  return "user_app_language_guest";
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read persisted language preference, default to English
  const [language, setLanguageState] = useState<string>(() => {
    const key = getCurrentLanguageKey();
    const saved = localStorage.getItem(key);
    if (!saved && key !== "user_app_language_guest") {
      return "en";
    }
    return saved ? normalizeLanguageCode(saved) : "en";
  });

  const setLanguage = (lang: string) => {
    const normalized = normalizeLanguageCode(lang);
    setLanguageState(normalized);
    
    // Save to the current user's specific key
    const currentKey = getCurrentLanguageKey();
    localStorage.setItem(currentKey, normalized);
    
    // Also save as guest selection to persist on login screens
    localStorage.setItem("user_app_language_guest", normalized);
    
    // Legacy support
    localStorage.setItem("user_app_language", normalized);
    
    // Dispatch custom event for real-time sync with other non-context modules
    const event = new CustomEvent("user_language_changed", { detail: normalized });
    window.dispatchEvent(event);
  };

  // Keep state in sync if localStorage changes or other parts trigger the event
  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail !== language) {
        setLanguageState(customEvent.detail);
      }
    };

    window.addEventListener("user_language_changed", handleLangChange);
    return () => window.removeEventListener("user_language_changed", handleLangChange);
  }, [language]);

  // DOM Auto-Translation and route-aware checks
  useEffect(() => {
    const skipElements = ["SCRIPT", "STYLE", "SVG", "PATH", "TEXTAREA", "CODE"];

    const isPanelRoutePath = () => {
      return window.location.pathname.startsWith("/admin") || 
             window.location.pathname.startsWith("/seller") || 
             window.location.pathname.startsWith("/delivery");
    };

    const hasNoTranslateAncestor = (node: Node | null): boolean => {
      let current = node;
      while (current) {
        if (current.nodeType === Node.ELEMENT_NODE) {
          const el = current as Element;
          if (
            el.getAttribute("translate") === "no" ||
            el.getAttribute("data-no-translate") === "true" ||
            el.classList.contains("no-translate") ||
            el.classList.contains("notranslate")
          ) {
            return true;
          }
        }
        current = current.parentNode;
      }
      return false;
    };

    const translateNode = async (node: Text) => {
      if (isPanelRoutePath()) {
        // Revert to original if previously translated
        if (originalTexts.has(node)) {
          const original = originalTexts.get(node);
          if (original && node.nodeValue !== original) {
            node.nodeValue = original;
          }
        }
        return;
      }

      const parent = node.parentElement;
      if (parent && skipElements.includes(parent.tagName)) {
        return;
      }

      if (hasNoTranslateAncestor(node)) {
        return;
      }

      const currentVal = node.nodeValue || "";
      
      if (!originalTexts.has(node)) {
        originalTexts.set(node, currentVal);
      }

      const originalText = originalTexts.get(node) || currentVal;

      const lastTranslation = translatedTexts.get(node);
      if (node.nodeValue !== lastTranslation && node.nodeValue !== originalText) {
        originalTexts.set(node, currentVal);
      }

      const originalTextToTranslate = originalTexts.get(node) || currentVal;
      const trimmedToTranslate = originalTextToTranslate.trim();

      if (!trimmedToTranslate || /^\d+$/.test(trimmedToTranslate) || trimmedToTranslate.length <= 1) {
        return;
      }

      if (language === "en") {
        if (lastTranslation && node.nodeValue === lastTranslation) {
          node.nodeValue = originalTextToTranslate;
        } else {
          originalTexts.set(node, currentVal);
        }
        return;
      }

      if (node.nodeValue === translatedTexts.get(node)) {
        return;
      }

      try {
        const translated = await translateText(trimmedToTranslate, language, "en");
        if (translated && translated !== trimmedToTranslate) {
          translatedTexts.set(node, translated);
          node.nodeValue = translated;
        }
      } catch (err) {
        console.error("DOM Text translation error:", err);
      }
    };

    const translatePlaceholder = async (element: Element) => {
      if (isPanelRoutePath()) {
        if (originalPlaceholders.has(element)) {
          const original = originalPlaceholders.get(element);
          if (original && element.getAttribute("placeholder") !== original) {
            element.setAttribute("placeholder", original);
          }
        }
        return;
      }

      if (hasNoTranslateAncestor(element)) {
        return;
      }

      const currentVal = element.getAttribute("placeholder") || "";

      if (!originalPlaceholders.has(element)) {
        originalPlaceholders.set(element, currentVal);
      }

      const originalText = originalPlaceholders.get(element) || currentVal;

      if (element.getAttribute("placeholder") !== translatedPlaceholders.get(element) && element.getAttribute("placeholder") !== originalText) {
        originalPlaceholders.set(element, currentVal);
      }

      const originalPlaceholderText = originalPlaceholders.get(element) || currentVal;
      const trimmedPlaceholder = originalPlaceholderText.trim();

      if (!trimmedPlaceholder) return;

      if (language === "en") {
        const lastTranslation = translatedPlaceholders.get(element);
        if (lastTranslation && element.getAttribute("placeholder") === lastTranslation) {
          element.setAttribute("placeholder", originalPlaceholderText);
        } else {
          originalPlaceholders.set(element, currentVal);
        }
        return;
      }

      if (element.getAttribute("placeholder") === translatedPlaceholders.get(element)) {
        return;
      }

      try {
        const translated = await translateText(trimmedPlaceholder, language, "en");
        if (translated) {
          translatedPlaceholders.set(element, translated);
          element.setAttribute("placeholder", translated);
        }
      } catch (err) {
        console.error("DOM Placeholder translation error:", err);
      }
    };

    const translateTitle = async (element: Element) => {
      if (isPanelRoutePath()) {
        if (originalTitles.has(element)) {
          const original = originalTitles.get(element);
          if (original && element.getAttribute("title") !== original) {
            element.setAttribute("title", original);
          }
        }
        return;
      }

      if (hasNoTranslateAncestor(element)) {
        return;
      }

      const currentVal = element.getAttribute("title") || "";

      if (!originalTitles.has(element)) {
        originalTitles.set(element, currentVal);
      }

      const originalText = originalTitles.get(element) || currentVal;

      if (element.getAttribute("title") !== translatedTitles.get(element) && element.getAttribute("title") !== originalText) {
        originalTitles.set(element, currentVal);
      }

      const originalTitleText = originalTitles.get(element) || currentVal;
      const trimmedTitle = originalTitleText.trim();

      if (!trimmedTitle) return;

      if (language === "en") {
        const lastTranslation = translatedTitles.get(element);
        if (lastTranslation && element.getAttribute("title") === lastTranslation) {
          element.setAttribute("title", originalTitleText);
        } else {
          originalTitles.set(element, currentVal);
        }
        return;
      }

      if (element.getAttribute("title") === translatedTitles.get(element)) {
        return;
      }

      try {
        const translated = await translateText(trimmedTitle, language, "en");
        if (translated) {
          translatedTitles.set(element, translated);
          element.setAttribute("title", translated);
        }
      } catch (err) {
        console.error("DOM Title translation error:", err);
      }
    };

    const walkAndTranslate = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        translateNode(node as Text);
      }

      const elementsWithPlaceholder = (root as Element).querySelectorAll
        ? (root as Element).querySelectorAll("[placeholder]")
        : [];
      elementsWithPlaceholder.forEach(translatePlaceholder);

      const elementsWithTitle = (root as Element).querySelectorAll
        ? (root as Element).querySelectorAll("[title]")
        : [];
      elementsWithTitle.forEach(translateTitle);

      if (root.nodeType === Node.ELEMENT_NODE) {
        const el = root as Element;
        if (el.hasAttribute("placeholder")) translatePlaceholder(el);
        if (el.hasAttribute("title")) translateTitle(el);
      }
    };

    // Location/Route change handling
    const handleLocationChange = () => {
      // Check user-specific language on route change
      const userKey = getCurrentLanguageKey();
      const userSavedLang = localStorage.getItem(userKey);
      if (userSavedLang && userSavedLang !== language) {
        setLanguageState(userSavedLang);
      } else if (!userSavedLang && userKey !== "user_app_language_guest" && language !== "en") {
        setLanguageState("en");
      }

      const html = document.documentElement;
      if (isPanelRoutePath()) {
        html.setAttribute("lang", "en");
        html.setAttribute("dir", "ltr");
        // Force revert all translated items currently in the body
        walkAndTranslate(document.body);
      } else {
        html.setAttribute("lang", language);
        html.setAttribute("dir", isRTL(language) ? "rtl" : "ltr");
        // Translate the current page
        walkAndTranslate(document.body);
      }
    };

    // Override pushState and replaceState to detect routing changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
      handleLocationChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
      handleLocationChange();
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("locationchange", handleLocationChange);

    // Initial load/translation
    handleLocationChange();

    // MutationObserver to translate new/updated nodes dynamically
    const observer = new MutationObserver((mutations) => {
      if (isPanelRoutePath()) return;

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              translateNode(node as Text);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              if (!skipElements.includes(el.tagName)) {
                walkAndTranslate(el);
              }
            }
          });
        } else if (mutation.type === "characterData") {
          const node = mutation.target as Text;
          translateNode(node);
        } else if (mutation.type === "attributes") {
          const el = mutation.target as Element;
          if (mutation.attributeName === "placeholder") {
            translatePlaceholder(el);
          } else if (mutation.attributeName === "title") {
            translateTitle(el);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title"],
    });

    return () => {
      observer.disconnect();
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("locationchange", handleLocationChange);
    };
  }, [language]);

  const isRtl = isRTL(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
