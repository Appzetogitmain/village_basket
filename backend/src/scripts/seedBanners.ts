import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { uploadImage } from '../services/cloudinaryService';
import HomeBanner from '../models/HomeBanner';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const bannerFiles = [
  {
    filePath: path.resolve(__dirname, '../../../frontend/assets/banner_organic_fruits_1782379947480.png'),
    title: 'Fresh Organic Fruits',
    subtitle: 'Directly from local farms, up to 20% off',
    link: 'category/fruits-vegetables',
    order: 0
  },
  {
    filePath: path.resolve(__dirname, '../../../frontend/assets/banner_sweets_dryfruits_1782379963686.png'),
    title: 'Mithai & Dry Fruits',
    subtitle: 'Handpicked premium sweets and rich dry fruits',
    link: 'category/sweets-snacks',
    order: 1
  },
  {
    filePath: path.resolve(__dirname, '../../../frontend/assets/banner_dairy_grocery_1782379978938.png'),
    title: 'Daily Fresh Dairy',
    subtitle: 'Pure milk, butter, and organic ghee delivered daily',
    link: 'category/dairy-bakery',
    order: 2
  },
  {
    filePath: path.resolve(__dirname, '../../../frontend/assets/banner_snacks_biscuits_1782379992372.png'),
    title: '10-Min Munchies',
    subtitle: 'Vibrant snacks, soft drinks & biscuits in 10 minutes',
    link: 'category/snacks-instant-food',
    order: 3
  }
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected! Clearing old banners...');
    await HomeBanner.deleteMany({});

    for (const b of bannerFiles) {
      console.log(`Uploading ${b.title}...`);
      const uploadRes = await uploadImage(b.filePath, {
        folder: 'home_banners'
      });

      console.log(`Uploaded! Saving to DB: ${uploadRes.secureUrl}`);
      await HomeBanner.create({
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: uploadRes.secureUrl,
        link: b.link,
        order: b.order,
        isActive: true
      });
    }

    console.log('Successfully seeded all 4 home banners!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
