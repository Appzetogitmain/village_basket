import React from "react";
import { useDynamicTranslation } from "../hooks/useDynamicTranslation";

interface TranslatedTextProps {
  text: string;
  sourceLang?: string;
  inline?: boolean;
  skeletonWidth?: string;
  className?: string;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  sourceLang = "en",
  inline = false,
  skeletonWidth = "60px",
  className = "",
}) => {
  const { translatedText, loading } = useDynamicTranslation(text, sourceLang);

  const Component = inline ? "span" : "div";

  if (loading) {
    return (
      <Component
        className={`inline-block animate-pulse bg-gray-200 dark:bg-zinc-700 rounded h-[1em] ${className}`}
        style={{
          width: skeletonWidth,
          verticalAlign: "middle",
          opacity: 0.6,
        }}
      />
    );
  }

  return (
    <Component
      className={`transition-opacity duration-300 ease-in-out ${className}`}
      style={{ opacity: 1 }}
    >
      {translatedText}
    </Component>
  );
};
export default TranslatedText;
