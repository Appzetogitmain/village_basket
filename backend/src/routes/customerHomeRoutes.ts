import { Router } from "express";
import { getHomeContent, getStoreProducts } from "../modules/customer/controllers/customerHomeController";
import { optionalAuthenticate } from "../middleware/auth";

const router = Router();

// Public routes (uses optionalAuthenticate to detect user type if logged in)
router.get("/", optionalAuthenticate, getHomeContent);
router.get("/store/:storeId", optionalAuthenticate, getStoreProducts);

export default router;
