import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  refreshDeliveryOtp,
  createReturnRequest,
  getMyReturnRequests,
  getMyReturnRequestById,
  getOrdersByDateRange,
} from "../modules/customer/controllers/customerOrderController";
import { authenticate } from "../middleware/auth";

const router = Router();

console.log('customerOrderRoutes is being loaded');

// Protected routes (must be logged in)
router.use(authenticate);

router.post("/", createOrder);
router.get("/", getMyOrders);
router.get("/by-date-range", getOrdersByDateRange);
router.get("/returns", getMyReturnRequests);
router.get("/returns/:returnId", getMyReturnRequestById);
router.get("/:id", getOrderById);
router.post("/:id/refresh-otp", refreshDeliveryOtp);
router.post("/:id/returns", createReturnRequest);

export default router;
