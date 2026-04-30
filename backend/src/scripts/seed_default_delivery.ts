/**
 * Seed Default Delivery Boy
 * Mobile: 9111966732
 * OTP: 1234 (mock OTP for dev/testing)
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/seed_default_delivery.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import Delivery from '../models/Delivery';

const MOBILE = '9111966732';

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI missing in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to DB');

    // Check if already exists
    const existing = await Delivery.findOne({ mobile: MOBILE });
    if (existing) {
      // Update to ensure Active + Approved status
      await Delivery.updateOne(
        { mobile: MOBILE },
        {
          $set: {
            status: 'Active',
            approvalStatus: 'Approved',
            isOnline: true,
          }
        }
      );
      console.log(`✅ Delivery user already exists (${existing._id}) — updated to Active/Approved`);
      return;
    }

    // Create new delivery user
    const newUser = await Delivery.create({
      name: 'Village Basket Delivery',
      mobile: MOBILE,
      email: 'delivery@villagebasket.in',
      address: 'Village Basket HQ',
      city: 'India',
      status: 'Active',
      approvalStatus: 'Approved',
      isOnline: true,
      balance: 0,
      cashCollected: 0,
      settings: {
        notifications: true,
        location: true,
        sound: true,
      },
    });

    console.log(`✅ Default delivery user created!`);
    console.log(`   ID     : ${newUser._id}`);
    console.log(`   Mobile : ${MOBILE}`);
    console.log(`   OTP    : 1234 (mock — works when USE_MOCK_OTP=true or NODE_ENV=development)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from DB');
  }
};

run();
