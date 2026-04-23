import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const AddressSchema = new mongoose.Schema({
  customer: mongoose.Schema.Types.ObjectId,
  fullName: String,
  address: String,
  city: String,
});

const Address = mongoose.model('Address', AddressSchema);

async function checkAddresses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');
    
    const count = await Address.countDocuments();
    console.log(`Total addresses in DB: ${count}`);
    
    const samples = await Address.find().limit(5);
    console.log('Sample addresses:', JSON.stringify(samples, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAddresses();
