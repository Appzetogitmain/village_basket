import { Request, Response } from "express";
import Delivery from "../../../models/Delivery";
import DeliveryAssignment from "../../../models/DeliveryAssignment";
import Order from "../../../models/Order";
import DeliveryWallet from "../../../models/DeliveryWallet";
import DeliveryTracking from "../../../models/DeliveryTracking";
import WithdrawRequest from "../../../models/WithdrawRequest";
import Notification from "../../../models/Notification";
import {
  sendSmsOtp as sendSmsOtpService,
  verifySmsOtp as verifySmsOtpService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendNotification } from "../../../services/notificationService";

/**
 * Send SMS OTP to delivery mobile number
 */
export const sendSmsOtp = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body;

  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Check if delivery partner exists with this mobile
  const delivery = await Delivery.findOne({ mobile });
  if (!delivery) {
    return res.status(400).json({
      success: false,
      message:
        "Delivery partner not found with this mobile number. Please register first.",
    });
  }

  if (delivery.status === "Deleted") {
    return res.status(403).json({
      success: false,
      message: "This account has been deleted and cannot log in.",
    });
  }

  const approvalStatus =
    delivery.approvalStatus || (delivery.status === "Active" ? "Approved" : "Pending");

  if (approvalStatus === "Rejected") {
    return res.status(403).json({
      success: false,
      message: "Your account has been rejected by admin. Please contact support.",
    });
  }

  if (approvalStatus !== "Approved") {
    return res.status(403).json({
      success: false,
      message: "Your account is pending admin approval.",
    });
  }

  if (delivery.status !== "Active") {
    return res.status(403).json({
      success: false,
      message: "Your account is inactive. Please contact admin.",
    });
  }

  // Send SMS OTP
  const result = await sendSmsOtpService(mobile, "Delivery");

  return res.status(200).json({
    success: true,
    message: result.message,
    sessionId: result.sessionId,
  });
});

/**
 * Verify SMS OTP and login delivery partner
 */
export const verifySmsOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { mobile, otp, sessionId } = req.body;

    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number is required",
      });
    }

    if (!otp || !/^[0-9]{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Valid 4-digit OTP is required",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    // Verify SMS OTP
    const isValid = await verifySmsOtpService(
      sessionId,
      otp,
      mobile,
      "Delivery",
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Find delivery partner
    const delivery = await Delivery.findOne({ mobile }).select("-password");

    if (!delivery) {
      return res.status(401).json({
        success: false,
        message: "Delivery partner not found. Please Register first.",
      });
    }

    if (delivery.status === "Deleted") {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted and cannot log in.",
      });
    }

    const approvalStatus =
      delivery.approvalStatus || (delivery.status === "Active" ? "Approved" : "Pending");

    if (approvalStatus === "Rejected") {
      return res.status(403).json({
        success: false,
        message: "Your account has been rejected by admin. Please contact support.",
      });
    }

    if (approvalStatus !== "Approved") {
      return res.status(403).json({
        success: false,
        message: "Your account is pending admin approval.",
      });
    }

    if (delivery.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact admin.",
      });
    }

    // Generate JWT token
    const token = generateToken(delivery._id.toString(), "Delivery");

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: delivery._id,
          name: delivery.name,
          mobile: delivery.mobile,
          email: delivery.email,
          city: delivery.city,
          status: delivery.status,
          approvalStatus: delivery.approvalStatus || "Approved",
        },
      },
    });
  },
);

/**
 * Register new delivery partner
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    mobile,
    email,
    dateOfBirth,
    password,
    address,
    city,
    pincode,
    drivingLicense,
    nationalIdentityCard,
    accountName,
    bankName,
    accountNumber,
    ifscCode,
    bonusType,
  } = req.body;

  // Validation
  if (!name || !mobile || !email) {
    return res.status(400).json({
      success: false,
      message: "Name, mobile, and email are required",
    });
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Check if delivery partner already exists
  const existingDelivery = await Delivery.findOne({
    $or: [{ mobile }, { email }],
  });

  if (existingDelivery) {
    return res.status(409).json({
      success: false,
      message: "This mobile number or email is already registered.",
    });
  }

  // Create new delivery partner
  await Delivery.create({
    name,
    mobile,
    email,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    password,
    address,
    city,
    pincode,
    drivingLicense,
    nationalIdentityCard,
    accountName,
    bankName,
    accountNumber,
    ifscCode,
    bonusType,
    status: "Inactive", // New delivery partners start as Inactive
    approvalStatus: "Pending",
    balance: 0,
    cashCollected: 0,
  } as any);

  // Generate token (Optional: usually registration doesn't login immediately if approval needed, but for seamless UX we can)
  // However, FE Flow: Register -> OTP -> Login. So we return success, then FE calls sendSmsOtp.

  return res.status(201).json({
    success: true,
    message: "Delivery partner registered successfully. Your account is pending admin approval.",
    // No token returned here, flow continues to OTP
  });
});

/**
 * Get current delivery partner profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore - req.user is added by middleware
  const userId = (req.user as any).userId;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "User not authenticated" });
  }

  const delivery = await Delivery.findById(userId).select("-password");

  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: "Delivery partner not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: delivery,
  });
});

/**
 * Delete current delivery partner account (soft delete)
 */
export const selfDeleteAccount = asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore - req.user is added by middleware
  const userId = (req.user as any).userId;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "User not authenticated" });
  }

  const delivery = await Delivery.findById(userId);

  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: "Delivery partner not found",
    });
  }

  // 1. Find active assignments (status not in "Delivered", "Failed", "Cancelled")
  const activeAssignments = await DeliveryAssignment.find({
    deliveryBoy: userId,
    status: { $nin: ["Delivered", "Failed", "Cancelled"] }
  });

  // 2. Notify sellers and unassign rider from active orders
  for (const assignment of activeAssignments) {
    const order = await Order.findById(assignment.order);
    if (order) {
      // Find unique sellers involved in this order
      const sellers = new Set<string>();
      if (order.sellerPickups && order.sellerPickups.length > 0) {
        order.sellerPickups.forEach((p: any) => {
          if (p.seller) sellers.add(p.seller.toString());
        });
      }
      
      // Notify each seller
      for (const sellerId of sellers) {
        try {
          await sendNotification(
            "Seller",
            sellerId,
            "🚨 Delivery Partner Left",
            `Delivery partner ${delivery.name} has deleted their account. Please assign a new rider for Order #${order.orderNumber} to ensure timely delivery.`,
            { 
              type: "Warning", 
              priority: "High",
              link: `/orders/${order._id}`,
              data: { orderId: order._id.toString(), type: "RIDER_DELETED" }
            }
          );
        } catch (notifError) {
          console.error(`Failed to notify seller ${sellerId}:`, notifError);
        }
      }

      // Unassign the delivery boy from the order record
      order.deliveryBoy = undefined;
      order.deliveryBoyStatus = undefined;
      order.assignedAt = undefined;
      await order.save();
    }
  }

  // 3. Perform hard delete on all related data
  await Promise.all([
    // Delete financial data
    DeliveryWallet.findOneAndDelete({ deliveryBoy: userId }),
    WithdrawRequest.deleteMany({ userId, userType: "DELIVERY_BOY" }),
    
    // Delete communication/tracking data
    Notification.deleteMany({ recipientId: userId, recipientType: "Delivery" }),
    DeliveryTracking.deleteMany({ deliveryBoy: userId }),
    
    // Delete all assignments (past and present)
    DeliveryAssignment.deleteMany({ deliveryBoy: userId }),
    
    // Finally delete the delivery boy profile itself
    Delivery.findByIdAndDelete(userId)
  ]);

  return res.status(200).json({
    success: true,
    message: "Your account and all associated data have been permanently deleted.",
  });
});
