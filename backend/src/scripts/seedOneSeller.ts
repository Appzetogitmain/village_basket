/**
 * Seed one Approved seller for testing
 * Mobile: 9111966732 (OTP bypass 1234 in otpService)
 * Location: Indore
 *
 * Run: npx tsx src/scripts/seedOneSeller.ts
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import Seller from "../models/Seller";

// Indore city center
const INDORE_LAT = "22.7196";
const INDORE_LNG = "75.8577";

const SELLER = {
  sellerName: "Seed Seller",
  storeName: "Village Seed Store",
  email: "seed.seller@villagebasket.com",
  mobile: "9111966732",
  password: "Seller@123",
  category: "Grocery",
  address: "Rajwada, Indore",
  city: "Indore",
  searchLocation: "Indore, Madhya Pradesh",
  latitude: INDORE_LAT,
  longitude: INDORE_LNG,
  serviceRadiusKm: 50,
  status: "Approved" as const,
  requireProductApproval: false,
  viewCustomerDetails: true,
  commission: 10,
  balance: 0,
  categories: ["Grocery"],
  isShopOpen: true,
  fssaiLicNo: "10000000000000",
  storeDescription: "Seeded Indore store for testing (OTP 1234)",
};

async function run() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI missing in .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB:", mongoose.connection.name);

    // Remove older seed seller with different mobile if present
    await Seller.deleteOne({ email: "seed.seller@villagebasket.com", mobile: { $ne: SELLER.mobile } });

    const existing = await Seller.findOne({
      $or: [{ mobile: SELLER.mobile }, { email: SELLER.email }],
    });

    const location = {
      type: "Point" as const,
      coordinates: [parseFloat(INDORE_LNG), parseFloat(INDORE_LAT)] as [number, number],
    };

    if (existing) {
      existing.sellerName = SELLER.sellerName;
      existing.storeName = SELLER.storeName;
      existing.email = SELLER.email;
      existing.mobile = SELLER.mobile;
      existing.status = "Approved";
      existing.isShopOpen = true;
      existing.requireProductApproval = false;
      existing.viewCustomerDetails = true;
      existing.serviceRadiusKm = SELLER.serviceRadiusKm;
      existing.city = SELLER.city;
      existing.address = SELLER.address;
      existing.searchLocation = SELLER.searchLocation;
      existing.latitude = SELLER.latitude;
      existing.longitude = SELLER.longitude;
      existing.location = location;
      existing.password = SELLER.password;
      await existing.save();

      console.log("Updated seller:");
      console.log({
        id: existing._id.toString(),
        storeName: existing.storeName,
        mobile: existing.mobile,
        email: existing.email,
        status: existing.status,
        otp: "1234",
        city: existing.city,
        lat: existing.latitude,
        lng: existing.longitude,
        radiusKm: existing.serviceRadiusKm,
      });
    } else {
      const seller = await Seller.create({
        ...SELLER,
        location,
      });

      console.log("Created seller:");
      console.log({
        id: seller._id.toString(),
        storeName: seller.storeName,
        mobile: seller.mobile,
        email: seller.email,
        status: seller.status,
        otp: "1234",
        city: seller.city,
        lat: seller.latitude,
        lng: seller.longitude,
        radiusKm: seller.serviceRadiusKm,
      });
    }

    await mongoose.disconnect();
    console.log("Done.");
  } catch (error: any) {
    console.error("Seed failed:", error.message || error);
    process.exit(1);
  }
}

run();
