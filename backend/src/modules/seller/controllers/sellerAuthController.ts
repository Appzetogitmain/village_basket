import { Request, Response } from "express";
import Seller from "../../../models/Seller";
import {
  sendOTP as sendOTPService,
  verifyOTP as verifyOTPService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Send OTP to seller mobile number
 */
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body;

  if (!mobile || !/^[0-9]{10,12}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Check if seller exists with this mobile
  const normalizedMobile = mobile.slice(-10);
  const seller = await Seller.findOne({ mobile: normalizedMobile });
  if (!seller) {
    return res.status(404).json({
      success: false,
      message: "Seller not found with this mobile number",
    });
  }

  // Send OTP - for login, always use default OTP
  const result = await sendOTPService(mobile, "Seller", true);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Verify OTP and login seller
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, otp } = req.body;

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

    // Verify OTP
    const isValid = await verifyOTPService(normalizedMobile, otp, "Seller");
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Find seller
    const seller = await Seller.findOne({ mobile: normalizedMobile }).select("-password");
  if (!seller) {
    return res.status(404).json({
      success: false,
      message: "Seller not found",
    });
  }

  // Generate JWT token
  const token = generateToken(seller._id.toString(), "Seller");

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        id: seller._id,
        sellerName: seller.sellerName,
        mobile: seller.mobile,
        email: seller.email,
        storeName: seller.storeName,
        status: seller.status,
        logo: seller.logo,
        address: seller.address,
        city: seller.city,
      },
    },
  });
});

/**
 * Register new seller
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    sellerName,
    mobile,
    email,
    storeName,
    category,
    address,
    city,
    serviceableArea,
  } = req.body;

  // Validation (password removed - sellers don't need password during signup)
  if (!sellerName || !mobile || !email || !storeName || !category) {
    return res.status(400).json({
      success: false,
      message:
        "Required fields (Name, Mobile, Email, Store Name, Category) must be provided",
    });
  }

  if (!/^[0-9]{10,12}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  const normalizedMobile = mobile.slice(-10);

  // Validate location is provided
  const latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
  const longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;

  // Parse and validate service radius
  let serviceRadiusKm = 10; // Default 10km
  if (
    req.body.serviceRadiusKm !== undefined &&
    req.body.serviceRadiusKm !== null &&
    req.body.serviceRadiusKm !== ""
  ) {
    const parsedRadius =
      typeof req.body.serviceRadiusKm === "string"
        ? parseFloat(req.body.serviceRadiusKm)
        : Number(req.body.serviceRadiusKm);

    if (!isNaN(parsedRadius) && parsedRadius >= 0.1 && parsedRadius <= 100) {
      serviceRadiusKm = parsedRadius;
    } else {
      return res.status(400).json({
        success: false,
        message: "Service radius must be between 0.1 and 100 kilometers",
      });
    }
  }

  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    // Location is optional now to allow dynamic setting later
    // Just proceed without setting location if not provided
  }

  // Validate latitude and longitude ranges if provided
  if (
    latitude &&
    longitude &&
    (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid location coordinates",
    });
  }

  // Check if seller already exists
  const existingSeller = await Seller.findOne({
    $or: [{ mobile: normalizedMobile }, { email }],
  });

  if (existingSeller) {
    return res.status(409).json({
      success: false,
      message: "Seller already exists with this mobile or email",
    });
  }

  // Create GeoJSON location point [longitude, latitude] if provided
  const location =
    longitude && latitude
      ? {
        type: "Point" as const,
        coordinates: [longitude, latitude],
      }
      : undefined;

  // Create new seller with GeoJSON location (password not required during signup)
  const seller = await Seller.create({
    sellerName,
    mobile: normalizedMobile,
    email,
    // password field removed - sellers don't need password during signup
    storeName,
    category,
    address,
    city,
    ...(serviceableArea && { serviceableArea }),
    searchLocation: req.body.searchLocation,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    location, // GeoJSON location for geospatial queries
    serviceRadiusKm, // Service radius in kilometers
    status: "Pending",
    requireProductApproval: false,
    viewCustomerDetails: false,
    commission: 0,
    balance: 0,
    categories: req.body.categories || [],
  });

  // Generate token
  const token = generateToken(seller._id.toString(), "Seller");

  // Notify Admin
  try {
    const { sendNotification } = await import("../../../services/notificationService");
    const Admin = (await import("../../../models/Admin")).default;
    const admins = await Admin.find({ status: "Active" });
    for (const admin of admins) {
      await sendNotification("Admin", admin._id.toString(), "New Registration", `New seller "${storeName}" has registered.`, {
        type: "Info",
        idempotencyKey: `new_seller_${seller._id}`
      });
    }
  } catch (pushErr) {
    console.error("Error notifying admin of new seller:", pushErr);
  }

  return res.status(201).json({
    success: true,
    message: "Seller registered successfully. Awaiting admin approval.",
    data: {
      token,
      user: {
        id: seller._id,
        sellerName: seller.sellerName,
        mobile: seller.mobile,
        email: seller.email,
        storeName: seller.storeName,
        status: seller.status,
        address: seller.address,
        city: seller.city,
      },
    },
  });
});

/**
 * Get seller's profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;

  const seller = await Seller.findById(sellerId).select("-password");
  if (!seller) {
    return res.status(404).json({
      success: false,
      message: "Seller not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: seller,
  });
});

/**
 * Update seller's profile
 */
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const {
      sellerName,
      storeName,
      category,
      address,
      city,
      searchLocation,
      latitude,
      longitude,
      serviceRadiusKm,
      panCard,
      taxName,
      taxNumber,
      accountName,
      bankName,
      branch,
      accountNumber,
      ifsc,
      profile,
      logo,
      storeBanner,
      storeDescription,
      serviceableArea,
    } = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (sellerName !== undefined) seller.sellerName = sellerName;
    if (storeName !== undefined) seller.storeName = storeName;
    if (category !== undefined) seller.category = category;
    if (address !== undefined) seller.address = address;
    if (city !== undefined) seller.city = city;
    if (searchLocation !== undefined) seller.searchLocation = searchLocation;
    if (serviceableArea !== undefined) seller.serviceableArea = serviceableArea;
    if (panCard !== undefined) seller.panCard = panCard;
    if (taxName !== undefined) seller.taxName = taxName;
    if (taxNumber !== undefined) seller.taxNumber = taxNumber;
    if (accountName !== undefined) seller.accountName = accountName;
    if (bankName !== undefined) seller.bankName = bankName;
    if (branch !== undefined) seller.branch = branch;
    if (accountNumber !== undefined) seller.accountNumber = accountNumber;
    if (ifsc !== undefined) seller.ifsc = ifsc;
    if (profile !== undefined) seller.profile = profile;
    if (logo !== undefined) seller.logo = logo;
    if (storeBanner !== undefined) seller.storeBanner = storeBanner;
    if (storeDescription !== undefined) seller.storeDescription = storeDescription;

    if (latitude !== undefined && longitude !== undefined) {
      const parsedLatitude = parseFloat(latitude);
      const parsedLongitude = parseFloat(longitude);

      if (!isNaN(parsedLatitude) && !isNaN(parsedLongitude)) {
        seller.latitude = parsedLatitude.toString();
        seller.longitude = parsedLongitude.toString();
        seller.location = {
          type: "Point",
          coordinates: [parsedLongitude, parsedLatitude],
        };
      }
    }

    if (
      serviceRadiusKm !== undefined &&
      serviceRadiusKm !== null &&
      serviceRadiusKm !== ""
    ) {
      const radius =
        typeof serviceRadiusKm === "string"
          ? parseFloat(serviceRadiusKm)
          : Number(serviceRadiusKm);

      if (!isNaN(radius) && radius >= 0.1 && radius <= 100) {
        seller.serviceRadiusKm = radius;
      } else {
        return res.status(400).json({
          success: false,
          message: "Service radius must be between 0.1 and 100 kilometers",
        });
      }
    }

    await seller.save();

    const updatedSeller = await Seller.findById(sellerId).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedSeller,
    });
  },
);

/**
 * Toggle shop status (Open/Close)
 */
export const toggleShopStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Handle undefined case - if isShopOpen is undefined, default to true (open) then toggle to false
    // This ensures backward compatibility with sellers created before this field was added
    if (seller.isShopOpen === undefined) {
      seller.isShopOpen = false; // Toggle from default "open" to "closed"
    } else {
      seller.isShopOpen = !seller.isShopOpen; // Normal toggle
    }

    // Fix invalid GeoJSON location objects
    // MongoDB requires that if location.type is "Point", coordinates must be a valid array
    if (seller.location && seller.location.type === "Point") {
      if (
        !seller.location.coordinates ||
        !Array.isArray(seller.location.coordinates) ||
        seller.location.coordinates.length !== 2
      ) {
        // Invalid location object - remove it to prevent validation error
        seller.location = undefined;
      }
    }

    await seller.save();

    return res.status(200).json({
      success: true,
      message: `Shop is now ${seller.isShopOpen ? "Open" : "Closed"}`,
      data: { isShopOpen: seller.isShopOpen },
    });
  },
);
