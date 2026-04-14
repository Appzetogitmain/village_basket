import { Router } from "express";
import {
  createInquiry,
  getAllInquiries,
  updateInquiryStatus,
} from "../controllers/inquiryController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// Public route to submit inquiry
router.post("/", createInquiry);

// Admin routes
router.get("/", authenticate, requireUserType("Admin"), getAllInquiries);
router.patch("/:id", authenticate, requireUserType("Admin"), updateInquiryStatus);

export default router;
