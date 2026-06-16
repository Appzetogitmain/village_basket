import { Translate } from "@google-cloud/translate/build/src/v2";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY;

export const translateClient = apiKey ? new Translate({ key: apiKey }) : null;

// Map local code keys to Google Translate API codes if different
export const languageCodeMap: Record<string, string> = {
  en: "en",
  hi: "hi",
  mr: "mr",
  te: "te",
  ta: "ta",
  kn: "kn",
};

export const RTL_LANGUAGES = ["ar", "he", "ur", "fa"];

export function getLanguageCode(lang: string): string {
  const normalized = lang.split("-")[0].toLowerCase();
  return languageCodeMap[normalized] || normalized;
}
