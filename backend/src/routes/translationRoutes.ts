import { Router } from "express";
import {
  handleTranslateText,
  handleTranslateBatch,
  handleTranslateObject,
} from "../controllers/translationController";

const router = Router();

// Translation endpoints (public)
router.post("/", handleTranslateText);
router.post("/batch", handleTranslateBatch);
router.post("/object", handleTranslateObject);

export default router;
