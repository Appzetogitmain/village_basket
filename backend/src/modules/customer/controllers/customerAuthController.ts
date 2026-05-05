import { Request, Response } from "express";
import Customer from "../../../models/Customer";
import {
  sendSmsOtp as sendSmsOtpService,
  verifySmsOtp as verifySmsOtpService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Send SMS OTP to customer mobile number
 * Returns session_id for verification
 */
export const sendSmsOtp = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, isSignUp, email } = req.body;

  if (!mobile || !/^[0-9]{10,12}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Check if customer exists
  const normalizedMobile = mobile.slice(-10);
  const customerByPhone = await Customer.findOne({ phone: normalizedMobile });
  const isSignUpRequest = isSignUp === true || isSignUp === 'true';

  if (!customerByPhone && !isSignUpRequest) {
    return res.status(404).json({
      success: false,
      message: "Mobile number is not registered. Please sign up first.",
    });
  }

  if (customerByPhone && isSignUpRequest) {
    return res.status(400).json({
      success: false,
      message: "Mobile number is already registered. Please login.",
    });
  }

  // If signing up, also check if email is already in use
  if (isSignUpRequest && email) {
    const customerByEmail = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (customerByEmail) {
      return res.status(400).json({
        success: false,
        message: "Email address is already registered. Please use a different email or login.",
      });
    }
  }

  // Send SMS OTP
  const result = await sendSmsOtpService(mobile, "Customer");

  return res.status(200).json({
    success: true,
    message: result.message,
    sessionId: result.sessionId,
  });
});

/**
 * Verify SMS OTP and login customer
 * Requires session_id and otp
 * Auto-creates customer if not exists
 */
export const verifySmsOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { mobile, otp, sessionId, customerType } = req.body;

    if (!mobile || !/^[0-9]{10,12}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number is required",
      });
    }

    const normalizedMobile = mobile.slice(-10);

    if (!otp || !/^[0-9]{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Valid 4-digit OTP is required",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for verification",
      });
    }

    // Verify SMS OTP
    const isValid = await verifySmsOtpService(
      sessionId,
      otp,
      normalizedMobile,
      "Customer",
    );
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Find or create customer
    let customer = await Customer.findOne({ phone: normalizedMobile });
    let isNewUser = false;

    if (!customer) {
      // Use provided name and email or placeholders
      const { name, email } = req.body;

      if (email) {
        const emailExists = await Customer.findOne({
          email: email.toLowerCase().trim(),
        });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "Email address is already registered. Please use a different email or login.",
          });
        }
      }
      
      customer = await Customer.create({
        phone: normalizedMobile,
        name: name || "User",
        email: email || `${normalizedMobile}@villagebasket.temp`,
        status: "Active",
        walletAmount: 0,
        totalOrders: 0,
        totalSpent: 0,
        userType: customerType || 'retail',
      });
      isNewUser = true;
    }

    // Generate JWT token
    const token = generateToken(customer._id.toString(), "Customer", undefined, customer.userType || 'retail');

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "Account created and login successful"
        : "Login successful",
      data: {
        token,
        user: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          walletAmount: customer.walletAmount,
          refCode: customer.refCode,
          status: customer.status,
          userType: 'Customer',
          customerType: customer.userType || 'retail',
        },
        isNewUser,
      },
    });
  },
);
