import { Router } from "express";
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getDeliveryBoys,
  assignDeliveryBoy,
} from "../modules/seller/controllers/orderController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and seller user type
router.use(authenticate);
router.use(requireUserType("Seller"));

// Get seller's orders with filters
router.get("/", getOrders);

// Get available delivery boys for manual assignment
router.get("/delivery-boys", getDeliveryBoys);

// Get order by ID (must be after /delivery-boys!)
router.get("/:id", getOrderById);

// Update order status
router.patch("/:id/status", updateOrderStatus);

// Assign manual delivery boy
router.post("/:id/assign-delivery", assignDeliveryBoy);

export default router;
