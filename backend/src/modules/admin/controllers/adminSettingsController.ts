import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import AppSettings from "../../../models/AppSettings";
import PaymentMethod from "../../../models/PaymentMethod";

/**
 * Get app settings
 */
export const getAppSettings = asyncHandler(
  async (_req: Request, res: Response) => {
    let settings = await AppSettings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await AppSettings.create({
        appName: "Village Basket",
        contactEmail: "contact@villagebasket.com",
        contactPhone: "1234567890",
      });
    }

    return res.status(200).json({
      success: true,
      message: "App settings fetched successfully",
      data: settings,
    });
  }
);

/**
 * Update app settings
 */
export const updateAppSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const updateData = req.body;
    updateData.updatedBy = req.user?.userId;

    console.log(`[DEBUG Settings] Incoming update payload:`, JSON.stringify(updateData.deliveryConfig, null, 2));

    let settings = await AppSettings.findOne();

    if (!settings) {
      settings = await AppSettings.create(updateData);
    } else {
      settings = await AppSettings.findOneAndUpdate({}, updateData, {
        new: true,
        runValidators: true,
      });
    }

    console.log(`[DEBUG Settings] Updated settings:`, JSON.stringify(settings?.deliveryConfig, null, 2));

    return res.status(200).json({
      success: true,
      message: "App settings updated successfully",
      data: settings,
    });
  }
);

/**
 * Get payment methods
 */
export const getPaymentMethods = asyncHandler(
  async (_req: Request, res: Response) => {
    const paymentMethods = await PaymentMethod.find().sort({ order: 1 });

    return res.status(200).json({
      success: true,
      message: "Payment methods fetched successfully",
      data: paymentMethods,
    });
  }
);

/**
 * Update payment methods
 */
export const updatePaymentMethods = asyncHandler(
  async (req: Request, res: Response) => {
    const { paymentMethods } = req.body; // Array of payment method objects

    if (!Array.isArray(paymentMethods)) {
      return res.status(400).json({
        success: false,
        message: "Payment methods array is required",
      });
    }

    // Update or create each payment method
    const updatePromises = paymentMethods.map((pm: any) =>
      PaymentMethod.findOneAndUpdate({ name: pm.name }, pm, {
        upsert: true,
        new: true,
        runValidators: true,
      })
    );

    await Promise.all(updatePromises);

    const updatedMethods = await PaymentMethod.find().sort({ order: 1 });

    return res.status(200).json({
      success: true,
      message: "Payment methods updated successfully",
      data: updatedMethods,
    });
  }
);

/**
 * Get SMS gateway settings
 */
export const getSMSGatewaySettings = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await AppSettings.findOne().select("smsGateway");

    return res.status(200).json({
      success: true,
      message: "SMS gateway settings fetched successfully",
      data: settings?.smsGateway || null,
    });
  }
);

/**
 * Update SMS gateway settings
 */
export const updateSMSGatewaySettings = asyncHandler(
  async (req: Request, res: Response) => {
    const { smsGateway } = req.body;

    let settings = await AppSettings.findOne();

    if (!settings) {
      settings = await AppSettings.create({
        appName: "Village Basket",
        contactEmail: "contact@villagebasket.com",
        contactPhone: "1234567890",
        smsGateway,
      });
    } else {
      settings.smsGateway = smsGateway;
      settings.updatedBy = req.user?.userId as any;
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: "SMS gateway settings updated successfully",
      data: settings.smsGateway,
    });
  }
);

/**
 * Get Razorpay configuration from DB
 */
export const getRazorpayConfig = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await AppSettings.findOne().select("paymentGateways");
    const razorpay = settings?.paymentGateways?.razorpay;

    return res.status(200).json({
      success: true,
      message: "Razorpay config fetched successfully",
      data: {
        enabled: razorpay?.enabled ?? false,
        keyId: razorpay?.keyId || "",
        keySecret: razorpay?.keySecret || "",
      },
    });
  }
);

/**
 * Update Razorpay configuration in DB
 */
export const updateRazorpayConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const { RAZORPAY_API_KEY, RAZORPAY_SECRET_KEY, enabled = true } = req.body || {};

    if (!RAZORPAY_API_KEY || !RAZORPAY_SECRET_KEY) {
      return res.status(400).json({
        success: false,
        message: "RAZORPAY_API_KEY and RAZORPAY_SECRET_KEY are required",
      });
    }

    const settings = await AppSettings.findOneAndUpdate(
      {},
      {
        $set: {
          "paymentGateways.razorpay.enabled": Boolean(enabled),
          "paymentGateways.razorpay.keyId": String(RAZORPAY_API_KEY),
          "paymentGateways.razorpay.keySecret": String(RAZORPAY_SECRET_KEY),
          updatedBy: req.user?.userId,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Razorpay config updated successfully",
      data: {
        enabled: settings?.paymentGateways?.razorpay?.enabled ?? true,
        keyId: settings?.paymentGateways?.razorpay?.keyId || "",
      },
    });
  }
);
