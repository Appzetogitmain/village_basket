import { Request, Response } from "express";
import Seller from "../../../models/Seller";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  activateApprovedSellerProducts,
  deleteSellerProducts,
} from "../../../utils/sellerProductLifecycle";

/**
 * Get all sellers (Admin only)
 */
export const getAllSellers = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, search } = req.query;

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { sellerName: { $regex: search, $options: "i" } },
        { storeName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const sellers = await Seller.find(query)
      .select("-password") // Exclude password
      .sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json({
      success: true,
      message: "Sellers fetched successfully",
      data: sellers,
    });
  }
);

/**
 * Get seller by ID
 */
export const getSellerById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const seller = await Seller.findById(id).select("-password");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Seller fetched successfully",
      data: seller,
    });
  }
);

/**
 * Update seller status (Approve/Reject)
 */
export const updateSellerStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["Approved", "Pending", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (Approved, Pending, or Rejected)",
      });
    }

    const seller = await Seller.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select("-password");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    let activatedProducts = 0;
    if (status === "Approved") {
      activatedProducts = await activateApprovedSellerProducts(id);
    }

    return res.status(200).json({
      success: true,
      message: `Seller status updated to ${status}`,
      data: seller,
      ...(activatedProducts > 0 && {
        meta: { activatedProducts },
      }),
    });
  }
);

/**
 * Update seller details (Admin)
 */
export const updateSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      sellerName,
      storeName,
      category,
      email,
      mobile,
      address,
      city,
      serviceableArea,
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
      commission,
      requireProductApproval,
      viewCustomerDetails,
    } = req.body;

    const seller = await Seller.findById(id);
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
    if (serviceableArea !== undefined) seller.serviceableArea = serviceableArea;
    if (searchLocation !== undefined) seller.searchLocation = searchLocation;
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

    if (email !== undefined && email.trim() !== seller.email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingSeller = await Seller.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });
      if (existingSeller) {
        return res.status(409).json({
          success: false,
          message: "Email already in use by another seller",
        });
      }
      seller.email = normalizedEmail;
    }

    if (mobile !== undefined) {
      const normalizedMobile = String(mobile).replace(/\D/g, "").slice(-10);
      if (!/^[0-9]{10}$/.test(normalizedMobile)) {
        return res.status(400).json({
          success: false,
          message: "Valid 10-digit mobile number is required",
        });
      }
      if (normalizedMobile !== seller.mobile) {
        const existingSeller = await Seller.findOne({
          mobile: normalizedMobile,
          _id: { $ne: id },
        });
        if (existingSeller) {
          return res.status(409).json({
            success: false,
            message: "Mobile number already in use by another seller",
          });
        }
        seller.mobile = normalizedMobile;
      }
    }

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

    if (commission !== undefined && commission !== null && commission !== "") {
      const commissionValue = Number(commission);
      if (!isNaN(commissionValue) && commissionValue >= 0) {
        seller.commission = commissionValue;
      }
    }

    if (requireProductApproval !== undefined) {
      seller.requireProductApproval = Boolean(requireProductApproval);
    }
    if (viewCustomerDetails !== undefined) {
      seller.viewCustomerDetails = Boolean(viewCustomerDetails);
    }

    await seller.save();

    if (seller.status === "Approved") {
      await activateApprovedSellerProducts(id);
    }

    const updatedSeller = await Seller.findById(id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Seller updated successfully",
      data: updatedSeller,
    });
  }
);

/**
 * Delete seller
 */
export const deleteSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const seller = await Seller.findById(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    const { productsDeleted, inventoryDeleted } = await deleteSellerProducts(id);

    await Seller.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Seller deleted successfully",
      data: {
        productsDeleted,
        inventoryDeleted,
      },
    });
  }
);


