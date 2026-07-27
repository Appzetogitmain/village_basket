/**
 * Seed Delivery Boy — Indore
 * Mobile: 9111966732
 * OTP: 1234 (otpService special bypass)
 *
 * Run: npx tsx src/scripts/seed_default_delivery.ts
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import Delivery from "../models/Delivery";

const MOBILE = "9111966732";
const INDORE_LAT = 22.7196;
const INDORE_LNG = 75.8577;

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI missing in .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected:", mongoose.connection.name);

    const payload = {
      name: "Indore Delivery Partner",
      mobile: MOBILE,
      email: "delivery.indore@villagebasket.in",
      address: "Rajwada, Indore, Madhya Pradesh",
      city: "Indore",
      pincode: "452001",
      status: "Active" as const,
      approvalStatus: "Approved" as const,
      isOnline: true,
      balance: 0,
      cashCollected: 0,
      vehicleType: "Bike",
      vehicleNumber: "MP09AB1234",
      location: {
        type: "Point" as const,
        coordinates: [INDORE_LNG, INDORE_LAT] as [number, number],
      },
      settings: {
        notifications: true,
        location: true,
        sound: true,
      },
    };

    const existing = await Delivery.findOne({
      $or: [{ mobile: MOBILE }, { email: payload.email }],
    });

    if (existing) {
      existing.name = payload.name;
      existing.mobile = MOBILE;
      existing.email = payload.email;
      existing.address = payload.address;
      existing.city = payload.city;
      existing.pincode = payload.pincode;
      existing.status = "Active";
      existing.approvalStatus = "Approved";
      existing.isOnline = true;
      existing.vehicleType = payload.vehicleType;
      existing.vehicleNumber = payload.vehicleNumber;
      existing.location = payload.location;
      existing.settings = payload.settings;
      await existing.save();

      console.log("Updated delivery boy:");
      console.log({
        id: existing._id.toString(),
        name: existing.name,
        mobile: existing.mobile,
        otp: "1234",
        city: existing.city,
        lat: INDORE_LAT,
        lng: INDORE_LNG,
        status: existing.status,
        approvalStatus: existing.approvalStatus,
        isOnline: existing.isOnline,
      });
    } else {
      const created = await Delivery.create(payload);
      console.log("Created delivery boy:");
      console.log({
        id: created._id.toString(),
        name: created.name,
        mobile: created.mobile,
        otp: "1234",
        city: created.city,
        lat: INDORE_LAT,
        lng: INDORE_LNG,
        status: created.status,
        approvalStatus: created.approvalStatus,
        isOnline: created.isOnline,
      });
    }
  } catch (error: any) {
    console.error("Seed failed:", error.message || error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Done.");
  }
};

run();
