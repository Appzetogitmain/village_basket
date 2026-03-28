import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import Customer from '../models/Customer';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/village_basket';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    const result = await Customer.updateMany(
      { userType: { $exists: false } },
      { $set: { userType: 'retail' } }
    );

    console.log(`Migration complete! Updated ${result.modifiedCount} customers.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
