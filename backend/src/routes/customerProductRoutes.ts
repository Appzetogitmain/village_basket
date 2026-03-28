import { Router } from "express";
import { getProducts, getProductById } from "../modules/customer/controllers/customerProductController";
import { optionalAuthenticate } from "../middleware/auth";

const router = Router();

// Public routes (uses optionalAuthenticate to detect user type if logged in)
router.get("/", optionalAuthenticate, getProducts);
router.get("/:id", optionalAuthenticate, getProductById);

export default router;
