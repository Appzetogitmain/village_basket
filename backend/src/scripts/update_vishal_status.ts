import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Delivery from '../models/Delivery';

dotenv.config();

async function updateVishalStatus() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/village-basket';
    console.log('Connecting to', mongoUri);
    await mongoose.connect(mongoUri);
    
    // Find Vishal
    const vishal = await Delivery.findOne({ name: { $regex: /vishal/i } });
    if (!vishal) {
      console.log('Could not find delivery boy with name matching "vishal"');
      process.exit(0);
    }
    
    console.log(`Found Vishal. Current status: ${vishal.status}, isOnline: ${vishal.isOnline}`);
    
    vishal.status = 'Active';
    vishal.isOnline = true;
    await vishal.save();
    
    console.log('Updated vishal to be active and online.');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateVishalStatus();
