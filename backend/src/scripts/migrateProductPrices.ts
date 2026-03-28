import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import Product from '../models/Product';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/village_basket';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate.`);

    let updatedCount = 0;

    for (const product of products) {
      let isChanged = false;

      if (product.variations && product.variations.length > 0) {
        for (const variation of product.variations) {
          // Check if retailPrice is not set and move existing price to it
          if (variation.retailPrice === undefined && variation.price !== undefined) {
            variation.retailPrice = variation.price;
            variation.retailDiscPrice = variation.discPrice || 0;
            
            // Default wholesale price to retail price during initial migration
            variation.wholesalePrice = variation.price;
            variation.wholesaleDiscPrice = variation.discPrice || 0;
            
            isChanged = true;
          }
        }
      }

      if (isChanged) {
        await product.save();
        updatedCount++;
        if (updatedCount % 10 === 0) {
          console.log(`Migrated ${updatedCount} products...`);
        }
      }
    }

    console.log(`Migration complete! Updated ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
