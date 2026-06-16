import { Request, Response } from "express";
import { translateText, translateBatch, translateObject } from "../services/translationService";

/**
 * Translate a single text string
 * POST /api/v1/translate
 */
export async function handleTranslateText(req: Request, res: Response): Promise<void> {
  try {
    const { text, targetLang, sourceLang = "en" } = req.body;

    if (!text || typeof text !== "string") {
      res.status(400).json({
        success: false,
        error: "Invalid or missing 'text' field. It must be a non-empty string.",
      });
      return;
    }

    if (!targetLang || typeof targetLang !== "string") {
      res.status(400).json({
        success: false,
        error: "Missing 'targetLang' field.",
      });
      return;
    }

    const translation = await translateText(text, targetLang, sourceLang);

    res.status(200).json({
      success: true,
      data: {
        original: text,
        translation,
        sourceLang,
        targetLang,
      },
    });
  } catch (error: any) {
    console.error("Error in handleTranslateText controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during translation.",
      details: error.message || error,
    });
  }
}

/**
 * Translate a batch of text strings
 * POST /api/v1/translate/batch
 */
export async function handleTranslateBatch(req: Request, res: Response): Promise<void> {
  try {
    const { texts, targetLang, sourceLang = "en" } = req.body;

    if (!texts || !Array.isArray(texts)) {
      res.status(400).json({
        success: false,
        error: "Invalid or missing 'texts' field. It must be an array of strings.",
      });
      return;
    }

    if (texts.length > 100) {
      res.status(400).json({
        success: false,
        error: "Batch size exceeds the limit of 100 texts.",
      });
      return;
    }

    if (!targetLang || typeof targetLang !== "string") {
      res.status(400).json({
        success: false,
        error: "Missing 'targetLang' field.",
      });
      return;
    }

    const translations = await translateBatch(texts, targetLang, sourceLang);

    res.status(200).json({
      success: true,
      data: {
        translations,
        sourceLang,
        targetLang,
      },
    });
  } catch (error: any) {
    console.error("Error in handleTranslateBatch controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during batch translation.",
      details: error.message || error,
    });
  }
}

/**
 * Translate properties inside an object or array of objects
 * POST /api/v1/translate/object
 */
export async function handleTranslateObject(req: Request, res: Response): Promise<void> {
  try {
    const { obj, targetLang, sourceLang = "en", keysToTranslate } = req.body;

    if (!obj || typeof obj !== "object") {
      res.status(400).json({
        success: false,
        error: "Invalid or missing 'obj' field. It must be an object or array.",
      });
      return;
    }

    if (!targetLang || typeof targetLang !== "string") {
      res.status(400).json({
        success: false,
        error: "Missing 'targetLang' field.",
      });
      return;
    }

    if (!keysToTranslate || !Array.isArray(keysToTranslate)) {
      res.status(400).json({
        success: false,
        error: "Invalid or missing 'keysToTranslate' field. It must be an array of strings.",
      });
      return;
    }

    const translatedObj = await translateObject(obj, targetLang, sourceLang, keysToTranslate);

    res.status(200).json({
      success: true,
      data: translatedObj,
    });
  } catch (error: any) {
    console.error("Error in handleTranslateObject controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during object translation.",
      details: error.message || error,
    });
  }
}
